import { isPlatformAdminEmail } from '#lib/auth/platform-admin';
import { loadOrgDashboard } from '#lib/dashboard/org';
import { loadPersonalDashboard } from '#lib/dashboard/personal';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.claims || !locals.profile || locals.profile.status !== 'approved') {
		error(401, 'Sign in required');
	}

	const email = locals.claims.email;
	const [org, personal] = await Promise.all([
		loadOrgDashboard(locals.supabase),
		isPlatformAdminEmail(email)
			? Promise.resolve(null)
			: loadPersonalDashboard(locals.supabase, locals.claims.sub)
	]);

	return {
		org,
		personal,
		showAttendance: !isPlatformAdminEmail(email)
	};
};
