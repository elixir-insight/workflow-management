import { isPlatformAdminEmail } from '#lib/auth/platform-admin';
import { loadPayrollDashboard } from '#lib/dashboard/payroll';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.claims || !locals.profile || locals.profile.status !== 'approved') {
		error(401, 'Sign in required');
	}

	return {
		dashboard: await loadPayrollDashboard(locals.supabase),
		showAttendance: !isPlatformAdminEmail(locals.claims.email)
	};
};
