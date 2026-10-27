import { loadPersonalDashboard } from '#lib/dashboard/personal';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.claims || !locals.profile || locals.profile.status !== 'approved') {
		error(401, 'Sign in required');
	}

	return {
		dashboard: await loadPersonalDashboard(locals.supabase, locals.claims.sub)
	};
};
