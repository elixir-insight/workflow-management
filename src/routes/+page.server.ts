import { isWorkEmail, defaultPassword } from '#lib/server/password';
import { roleHomes } from '#lib/auth/roles';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions = {
	login: async ({ request, locals }) => {
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
				error: 'Sign in with your @elixirpay.in email.',
				email
			});
		}

		const { data, error } = await locals.supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error || !data.user) {
			return fail(400, {
				error:
					!error || error.code === 'invalid_credentials'
						? 'Those credentials are not valid.'
						: 'Sign-in is unavailable right now. Try again.',
				email
			});
		}

		const { data: profile, error: profileError } = await locals.supabase
			.from('profiles')
			.select('role, must_reset_password')
			.eq('id', data.user.id)
			.maybeSingle();

		if (profileError || !profile) {
			await locals.supabase.auth.signOut();
			return fail(403, {
				error: 'This account does not have an attendance role yet.',
				email
			});
		}

		if (password === defaultPassword || profile.must_reset_password) {
			redirect(303, '/account/password');
		}

		redirect(303, roleHomes[profile.role]);
	}
} satisfies Actions;
