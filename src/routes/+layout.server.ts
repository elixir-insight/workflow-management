import { SUPABASE_URL } from '$app/env/private';
import { avatarPublicUrl } from '#lib/profile/display';
import { takeFlash } from '#lib/server/flash';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ cookies, locals }) => {
	const flash = takeFlash(cookies);

	if (!locals.claims || !locals.profile) {
		return { session: null, flash };
	}

	return {
		session: {
			email: locals.claims.email ?? '',
			role: locals.profile.role,
			status: locals.profile.status,
			mustResetPassword: locals.profile.mustResetPassword,
			firstName: locals.profile.firstName,
			lastName: locals.profile.lastName,
			avatarUrl: avatarPublicUrl(SUPABASE_URL, locals.profile.avatarPath)
		},
		flash
	};
};
