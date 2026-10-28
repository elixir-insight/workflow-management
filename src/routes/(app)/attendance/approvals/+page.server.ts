import { profileDisplayName } from '#lib/profile/display';
import { setFlash } from '#lib/server/flash';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.claims || !locals.profile || locals.profile.status !== 'approved') {
		error(401, 'Sign in required');
	}

	const userId = locals.claims.sub;

	type Applicant = {
		id: string;
		email: string;
		first_name: string;
		last_name: string;
		employee_id: string | null;
	};

	const [{ data: leaveRows }, { data: wfhRows }, { count: reportCount }] = await Promise.all([
		locals.supabase
			.from('leave_requests')
			.select(
				'id, leave_kind, start_date, end_date, day_count, reason, status, created_at, user_id, applicant:profiles!leave_requests_user_id_fkey(id, email, first_name, last_name, employee_id)'
			)
			.eq('approver_id', userId)
			.eq('status', 'pending')
			.order('created_at', { ascending: true }),
		locals.supabase
			.from('wfh_requests')
			.select(
				'id, work_date, reason, status, created_at, user_id, applicant:profiles!wfh_requests_user_id_fkey(id, email, first_name, last_name, employee_id)'
			)
			.eq('approver_id', userId)
			.eq('status', 'pending')
			.order('created_at', { ascending: true }),
		locals.supabase
			.from('profiles')
			.select('id', { count: 'exact', head: true })
			.eq('reports_to', userId)
			.eq('status', 'approved')
	]);

	const leaveRequests = (leaveRows ?? []).map((row) => {
		const person = (row.applicant as Applicant | null) ?? null;
		return {
			id: row.id,
			leave_kind: row.leave_kind,
			start_date: row.start_date,
			end_date: row.end_date,
			day_count: row.day_count,
			reason: row.reason,
			created_at: row.created_at,
			name: profileDisplayName(person ?? { email: '' }),
			email: person?.email ?? '',
			employeeId: person?.employee_id ?? null
		};
	});

	const wfhRequests = (wfhRows ?? []).map((row) => {
		const person = (row.applicant as Applicant | null) ?? null;
		return {
			id: row.id,
			work_date: row.work_date,
			reason: row.reason,
			created_at: row.created_at,
			name: profileDisplayName(person ?? { email: '' }),
			email: person?.email ?? '',
			employeeId: person?.employee_id ?? null
		};
	});

	return {
		leaveRequests,
		wfhRequests,
		isManager: (reportCount ?? 0) > 0
	};
};

export const actions = {
	decideLeave: async ({ request, cookies, locals }) => {
		if (!locals.claims || !locals.profile || locals.profile.status !== 'approved') {
			return fail(401, { error: 'Sign in required.' });
		}

		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		const decision = String(formData.get('decision') ?? '');

		if (!id || (decision !== 'approved' && decision !== 'rejected')) {
			return fail(400, { error: 'Invalid leave decision.' });
		}

		const { error: decideError } = await locals.supabase.rpc('decide_leave_request', {
			target: id,
			next_status: decision
		});

		if (decideError) {
			return fail(400, {
				error: decideError.message?.includes('insufficient')
					? 'Not enough leave balance left to approve.'
					: 'Leave decision could not be saved.'
			});
		}

		setFlash(cookies, {
			type: 'success',
			message: decision === 'approved' ? 'Leave approved.' : 'Leave rejected.'
		});
		redirect(303, '/attendance/approvals');
	},

	decideWfh: async ({ request, cookies, locals }) => {
		if (!locals.claims || !locals.profile || locals.profile.status !== 'approved') {
			return fail(401, { error: 'Sign in required.' });
		}

		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		const decision = String(formData.get('decision') ?? '');

		if (!id || (decision !== 'approved' && decision !== 'rejected')) {
			return fail(400, { error: 'Invalid WFH decision.' });
		}

		const { error: decideError } = await locals.supabase.rpc('decide_wfh_request', {
			target: id,
			next_status: decision
		});

		if (decideError) {
			return fail(400, { error: 'WFH decision could not be saved.' });
		}

		setFlash(cookies, {
			type: 'success',
			message: decision === 'approved' ? 'WFH approved.' : 'WFH rejected.'
		});
		redirect(303, '/attendance/approvals');
	}
} satisfies Actions;
