import { isWorkEmail } from '#lib/auth/access';
import { roleHomes } from '#lib/auth/roles';
import { setFlash } from '#lib/server/flash';
import { defaultPassword } from '#lib/server/password';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

function homeFor(role: 'admin' | 'payroll' | 'user' | null, mustResetPassword: boolean) {
	if (mustResetPassword) {
		return '/account/password';
	}

	return role ? roleHomes[role] : '/account/pending';
}

export const actions = {
	login: async ({ request, cookies, locals }) => {
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '')
			.trim()
			.toLowerCase();
		const password = String(formData.get('password') ?? '');

		if (!email || !password) {
			return fail(400, {
				error: 'Enter your email and password.',
				email
			});
		}

		if (!isWorkEmail(email)) {
			return fail(400, {
				error: 'Use an @elixirpay.in or @elixirglobal.com email.',
				email
			});
		}

		const signedIn = await locals.supabase.auth.signInWithPassword({ email, password });

		if (signedIn.error || !signedIn.data.user) {
			if (password !== defaultPassword) {
				return fail(400, {
					error:
						!signedIn.error || signedIn.error.code === 'invalid_credentials'
							? 'Those credentials are not valid.'
							: 'Sign-in is unavailable right now. Try again.',
					email
				});
			}

			const requested = await locals.supabase.auth.signUp({ email, password });
			const identities = requested.data.user?.identities;
			const alreadyRegistered =
				requested.error?.code === 'user_already_exists' ||
				(Array.isArray(identities) && identities.length === 0);

			if (requested.error || !requested.data.user || alreadyRegistered) {
				return fail(400, {
					error: alreadyRegistered
						? 'Those credentials are not valid.'
						: 'Access could not be requested right now. Try again.',
					email
				});
			}

			const afterRequest = await locals.supabase.auth.signInWithPassword({ email, password });

			if (afterRequest.error || !afterRequest.data.user) {
				return { pending: true, email };
			}
		}

		let userId = signedIn.data.user?.id;

		if (!userId) {
			const claims = (await locals.supabase.auth.getClaims()).data?.claims;
			userId = typeof claims?.sub === 'string' ? claims.sub : undefined;
		}

		if (!userId) {
			return { pending: true, email };
		}

		const { data: profile, error: profileError } = await locals.supabase
			.from('profiles')
			.select('role, status, must_reset_password')
			.eq('id', userId)
			.maybeSingle();

		if (profileError || !profile) {
			await locals.supabase.auth.signOut();
			return fail(403, {
				error: 'This account does not have an attendance profile yet.',
				email
			});
		}

		if (profile.status === 'pending') {
			setFlash(cookies, {
				type: 'warning',
				message: 'Signed in. Your access is still pending approval.'
			});
			redirect(303, '/account/pending');
		}

		if (profile.status === 'denied') {
			setFlash(cookies, {
				type: 'error',
				message: 'Signed in, but access to ElixirPay attendance was denied.'
			});
			redirect(303, '/account/pending');
		}

		const needsPassword =
			password === defaultPassword || Boolean(profile.must_reset_password);

		setFlash(cookies, {
			type: 'success',
			message: needsPassword
				? 'Signed in successfully. Set a new password to continue.'
				: 'Signed in successfully.'
		});
		redirect(303, homeFor(profile.role, needsPassword));
	}
} satisfies Actions;
