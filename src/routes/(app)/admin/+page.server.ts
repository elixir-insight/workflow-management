import { loadOrgDashboard } from '#lib/dashboard/org';
import { loadPersonalDashboard } from '#lib/dashboard/personal';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.claims || !locals.profile || locals.profile.status !== 'approved') {
		error(401, 'Sign in required');
	}

	const [org, personal] = await Promise.all([
		loadOrgDashboard(locals.supabase),
		loadPersonalDashboard(locals.supabase, locals.claims.sub, locals.claims.email)
	]);

	return {
		org,
		personal,
		showAttendance: true
	};
};
