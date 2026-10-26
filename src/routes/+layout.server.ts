import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
	if (!locals.claims || !locals.profile) {
		return { session: null };
	}

	return {
		session: {
			email: locals.claims.email ?? '',
			role: locals.profile.role,
			status: locals.profile.status,
			mustResetPassword: locals.profile.mustResetPassword
		}
	};
};
