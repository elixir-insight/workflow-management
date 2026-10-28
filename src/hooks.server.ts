import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '$app/env/private';
import { isPlatformAdminEmail } from '#lib/auth/platform-admin';
import { roleHomes } from '#lib/auth/roles';
import type { AppRole, Database } from '#lib/supabase/database';
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

function isAllowedPath(role: AppRole | null, pathname: string, email?: string) {
	if (pathname === '/logout' || pathname === '/profile' || pathname.startsWith('/profile/')) {
		return true;
	}

	const onAttendance = pathname === '/attendance' || pathname.startsWith('/attendance/');
	if (onAttendance) {
		return Boolean(role) && !isPlatformAdminEmail(email);
	}

	const onTimesheet = pathname === '/timesheet' || pathname.startsWith('/timesheet/');
	if (onTimesheet) {
		return role === 'admin' || role === 'payroll';
	}

	if (role === 'admin') {
		return pathname.startsWith('/admin');
	}

	if (role === 'payroll') {
		// Payroll can view user management and timesheet; leave edits only on profiles.
		// Logs stay admin-only.
		if (pathname.startsWith('/admin/logs')) return false;
		return (
			pathname === '/payroll' ||
			pathname === '/admin' ||
			pathname.startsWith('/admin/users')
		);
	}

	if (role === 'user') {
		return pathname === '/user' || pathname.startsWith('/user/');
	}

	return false;
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
			.select('role, status, must_reset_password, first_name, last_name, avatar_path')
			.eq('id', event.locals.claims.sub)
			.maybeSingle();

		if (!error && profile) {
			event.locals.profile = {
				role: profile.role,
				status: profile.status,
				mustResetPassword: profile.must_reset_password,
				firstName: profile.first_name,
				lastName: profile.last_name,
				avatarPath: profile.avatar_path
			};
		} else if (!error) {
			await event.locals.supabase.auth.signOut();
			event.locals.claims = null;
		}
	}

	if (isPageRequest(event.url.pathname)) {
		const pathname = event.url.pathname;
		const profile = event.locals.profile;

		if (pathname === '/account/profile' || pathname.startsWith('/account/profile/')) {
			redirect(303, '/profile');
		}

		if (!profile) {
			if (pathname !== '/' && pathname !== '/logout') {
				redirect(303, '/');
			}
		} else if (profile.status === 'pending' || profile.status === 'denied') {
			if (pathname !== '/account/pending' && pathname !== '/logout') {
				redirect(303, '/account/pending');
			}
		} else if (profile.mustResetPassword) {
			if (pathname !== '/account/password' && pathname !== '/logout') {
				redirect(303, '/account/password');
			}
		} else if (profile.role && pathname !== '/logout') {
			const home = roleHomes[profile.role];
			const allowed = isAllowedPath(profile.role, pathname, event.locals.claims?.email);

			if (
				pathname === '/' ||
				pathname === '/account/password' ||
				pathname === '/account/pending' ||
				!allowed
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
