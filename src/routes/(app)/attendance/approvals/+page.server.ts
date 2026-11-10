import { isPlatformAdminEmail } from '#lib/auth/platform-admin';
import { profileDisplayName } from '#lib/profile/display';
import { setFlash } from '#lib/server/flash';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

type Applicant = {
	id: string;
	email: string;
	first_name: string;
	last_name: string;
	employee_id: string | null;
};

function mapApplicant(person: Applicant | null) {
	return {
		name: profileDisplayName(person ?? { email: '' }),
		email: person?.email ?? '',
		employeeId: person?.employee_id ?? null
	};
}

function leaveErrorMessage(raw: string | undefined) {
	if (!raw) return 'Leave decision could not be saved.';
	if (raw.includes('insufficient')) return 'Not enough leave balance left to approve.';
	if (raw.includes('overlapping leave')) return 'That person already has leave on these dates.';
	return 'Leave decision could not be saved.';
}

function wfhErrorMessage(raw: string | undefined) {
	if (!raw) return 'WFH decision could not be saved.';
	if (raw.includes('wfh already exists')) return 'That person already has WFH on this date.';
	return 'WFH decision could not be saved.';
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.claims || !locals.profile || locals.profile.status !== 'approved') {
		error(401, 'Sign in required');
	}

	const userId = locals.claims.sub;
	const orgWideApprovals = isPlatformAdminEmail(locals.claims.email);

	const leaveQuery = locals.supabase
		.from('leave_requests')
		.select(
			'id, leave_kind, start_date, end_date, day_count, reason, status, created_at, decided_at, user_id, applicant:profiles!leave_requests_user_id_fkey(id, email, first_name, last_name, employee_id)'
		)
		.order('created_at', { ascending: false });
	const wfhQuery = locals.supabase
		.from('wfh_requests')
		.select(
			'id, work_date, reason, status, created_at, decided_at, user_id, applicant:profiles!wfh_requests_user_id_fkey(id, email, first_name, last_name, employee_id)'
		)
		.order('created_at', { ascending: false });

	if (!orgWideApprovals) {
		leaveQuery.eq('approver_id', userId);
		wfhQuery.eq('approver_id', userId);
	}

	const [{ data: leaveRows }, { data: wfhRows }, { count: reportCount }] = await Promise.all([
		leaveQuery,
		wfhQuery,
		locals.supabase
			.from('profiles')
			.select('id', { count: 'exact', head: true })
			.eq('reports_to', userId)
			.eq('status', 'approved')
	]);

	const leaveMapped = (leaveRows ?? []).map((row) => {
		const person = (row.applicant as Applicant | null) ?? null;
		return {
			id: row.id,
			leave_kind: row.leave_kind,
			start_date: row.start_date,
			end_date: row.end_date,
			day_count: row.day_count,
			reason: row.reason,
			status: row.status,
			created_at: row.created_at,
			decided_at: row.decided_at,
			...mapApplicant(person)
		};
	});

	const wfhMapped = (wfhRows ?? []).map((row) => {
		const person = (row.applicant as Applicant | null) ?? null;
		return {
			id: row.id,
			work_date: row.work_date,
			reason: row.reason,
			status: row.status,
			created_at: row.created_at,
			decided_at: row.decided_at,
			...mapApplicant(person)
		};
	});

	return {
		pendingLeave: leaveMapped.filter((row) => row.status === 'pending'),
		pendingWfh: wfhMapped.filter((row) => row.status === 'pending'),
		decidedLeave: leaveMapped.filter((row) => row.status !== 'pending'),
		decidedWfh: wfhMapped.filter((row) => row.status !== 'pending'),
		isManager: orgWideApprovals || (reportCount ?? 0) > 0,
		orgWideApprovals
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
			return fail(400, { error: leaveErrorMessage(decideError.message) });
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
			return fail(400, { error: wfhErrorMessage(decideError.message) });
		}

		setFlash(cookies, {
			type: 'success',
			message: decision === 'approved' ? 'WFH approved.' : 'WFH rejected.'
		});
		redirect(303, '/attendance/approvals');
	},

	reviseLeave: async ({ request, cookies, locals }) => {
		if (!locals.claims || !locals.profile || locals.profile.status !== 'approved') {
			return fail(401, { error: 'Sign in required.' });
		}

		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		const decision = String(formData.get('decision') ?? '');

		if (!id || (decision !== 'approved' && decision !== 'rejected')) {
			return fail(400, { error: 'Invalid leave revision.' });
		}

		const { error: reviseError } = await locals.supabase.rpc('revise_leave_request', {
			target: id,
			next_status: decision
		});

		if (reviseError) {
			return fail(400, { error: leaveErrorMessage(reviseError.message) });
		}

		setFlash(cookies, {
			type: 'success',
			message: decision === 'approved' ? 'Leave changed to approved.' : 'Leave changed to rejected.'
		});
		redirect(303, '/attendance/approvals');
	},

	reviseWfh: async ({ request, cookies, locals }) => {
		if (!locals.claims || !locals.profile || locals.profile.status !== 'approved') {
			return fail(401, { error: 'Sign in required.' });
		}

		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		const decision = String(formData.get('decision') ?? '');

		if (!id || (decision !== 'approved' && decision !== 'rejected')) {
			return fail(400, { error: 'Invalid WFH revision.' });
		}

		const { error: reviseError } = await locals.supabase.rpc('revise_wfh_request', {
			target: id,
			next_status: decision
		});

		if (reviseError) {
			return fail(400, { error: wfhErrorMessage(reviseError.message) });
		}

		setFlash(cookies, {
			type: 'success',
			message: decision === 'approved' ? 'WFH changed to approved.' : 'WFH changed to rejected.'
		});
		redirect(303, '/attendance/approvals');
	},

	deleteLeave: async ({ request, cookies, locals }) => {
		if (!locals.claims || !locals.profile || locals.profile.status !== 'approved') {
			return fail(401, { error: 'Sign in required.' });
		}

		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');

		if (!id) {
			return fail(400, { error: 'Choose a leave request to delete.' });
		}

		const { error: deleteError } = await locals.supabase.rpc('delete_leave_request_as_approver', {
			target: id
		});

		if (deleteError) {
			return fail(400, { error: 'The leave request could not be deleted.' });
		}

		setFlash(cookies, { type: 'success', message: 'Leave request deleted.' });
		redirect(303, '/attendance/approvals');
	},

	deleteWfh: async ({ request, cookies, locals }) => {
		if (!locals.claims || !locals.profile || locals.profile.status !== 'approved') {
			return fail(401, { error: 'Sign in required.' });
		}

		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');

		if (!id) {
			return fail(400, { error: 'Choose a WFH request to delete.' });
		}

		const { error: deleteError } = await locals.supabase.rpc('delete_wfh_request_as_approver', {
			target: id
		});

		if (deleteError) {
			return fail(400, { error: 'The WFH request could not be deleted.' });
		}

		setFlash(cookies, { type: 'success', message: 'WFH request deleted.' });
		redirect(303, '/attendance/approvals');
	}
} satisfies Actions;
