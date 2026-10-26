import { defaultPassword } from '#lib/server/password';
import { roleHomes } from '#lib/auth/roles';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions = {
	default: async ({ request, locals }) => {
		if (!locals.claims || !locals.profile) {
			redirect(303, '/');
		}

		const formData = await request.formData();
		const password = String(formData.get('password') ?? '');
		const confirmation = String(formData.get('confirmation') ?? '');

		if (password.length < 8) {
			return fail(400, { error: 'Use at least 8 characters.' });
		}

		if (password === defaultPassword) {
			return fail(400, {
				error: 'Choose a password that is different from the temporary password.'
			});
		}

		if (password !== confirmation) {
			return fail(400, { error: 'Those passwords do not match.' });
		}

		const { error } = await locals.supabase.auth.updateUser({ password });

		if (error) {
			return fail(400, { error: 'The password could not be changed. Try again.' });
		}

		const { data: profile, error: profileError } = await locals.supabase
			.from('profiles')
			.select('role, must_reset_password')
			.eq('id', locals.claims.sub)
			.maybeSingle();

		if (profileError || !profile || profile.must_reset_password || !profile.role) {
			return fail(400, { error: 'The password could not be changed. Try again.' });
		}

		redirect(303, roleHomes[profile.role]);
	}
} satisfies Actions;
