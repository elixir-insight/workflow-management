import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '$app/env/private';
import { roleHomes } from '#lib/auth/roles';
import type { Database } from '#lib/supabase/database';
import { createServerClient } from '@supabase/ssr';
import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';

export type AuthClaims = {
	sub: string;
	email?: string;
};

function readClaims(
	claims: { sub?: unknown; email?: unknown } | null | undefined
): AuthClaims | null {
	if (!claims || typeof claims.sub !== 'string') {
		return null;
	}

	return {
		sub: claims.sub,
		email: typeof claims.email === 'string' ? claims.email : undefined
	};
}

function isPageRequest(pathname: string) {
	return (
		!pathname.startsWith('/_app') &&
		!pathname.startsWith('/@') &&
		!pathname.startsWith('/src/') &&
		!pathname.startsWith('/node_modules/') &&
		!pathname.startsWith('/.svelte-kit/') &&
		!/\.[a-zA-Z0-9]+$/.test(pathname)
	);
}

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
		cookies: {
			getAll() {
				return event.cookies.getAll();
			},
			setAll(cookiesToSet, headers) {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: '/' });
				});

				try {
					event.setHeaders(headers);
				} catch {
					// The session cookie is already stored. Header updates can fail after a response starts.
				}
			}
		}
	});

	event.locals.profile = null;

	const { data } = await event.locals.supabase.auth.getClaims();
	event.locals.claims = readClaims(data?.claims);

	if (event.locals.claims) {
		const { data: profile, error } = await event.locals.supabase
			.from('profiles')
			.select('role, status, must_reset_password')
			.eq('id', event.locals.claims.sub)
			.maybeSingle();

		if (!error && profile) {
			event.locals.profile = {
				role: profile.role,
				status: profile.status,
				mustResetPassword: profile.must_reset_password
			};
		} else if (!error) {
			await event.locals.supabase.auth.signOut();
			event.locals.claims = null;
		}
	}

	if (isPageRequest(event.url.pathname)) {
		const pathname = event.url.pathname;
		const profile = event.locals.profile;

		if (!profile) {
			if (pathname !== '/' && pathname !== '/logout') {
				redirect(303, '/');
			}
		} else if (profile.status === 'pending') {
			if (pathname !== '/account/pending' && pathname !== '/logout') {
				redirect(303, '/account/pending');
			}
		} else if (profile.mustResetPassword) {
			if (pathname !== '/account/password' && pathname !== '/logout') {
				redirect(303, '/account/password');
			}
		} else if (profile.role) {
			const home = roleHomes[profile.role];
			const onHome = profile.role === 'admin' ? pathname.startsWith('/admin') : pathname === home;

			if (
				pathname === '/' ||
				pathname === '/account/password' ||
				pathname === '/account/pending' ||
				!onHome
			) {
				redirect(303, home);
			}
		}
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
