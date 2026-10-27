import { error, fail, redirect } from '@sveltejs/kit';
import { setFlash } from '#lib/server/flash';
import type { Actions, PageServerLoad } from './$types';

function todayIso() {
	return new Date().toISOString().slice(0, 10);
}

function normalizeTime(value: FormDataEntryValue | null) {
	const raw = String(value ?? '').trim();
	if (!raw) return null;
	if (!/^\d{2}:\d{2}$/.test(raw)) return null;
	return `${raw}:00`;
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.claims || !locals.profile || locals.profile.status !== 'approved') {
		error(401, 'Sign in required');
	}

	const userId = locals.claims.sub;
	const today = todayIso();

	const [
		{ data: profile },
		{ data: todayAttendance },
		{ data: leaveRequests },
		{ data: wfhRequests },
		{ count: pendingLeaveCount },
		{ count: pendingWfhCount },
		{ count: reportCount }
	] = await Promise.all([
		locals.supabase
			.from('profiles')
			.select('casual_leave, earned_leave, reports_to, employee_id, designation')
			.eq('id', userId)
			.maybeSingle(),
		locals.supabase
			.from('attendance_days')
			.select('id, work_date, in_time, out_time')
			.eq('user_id', userId)
			.eq('work_date', today)
			.maybeSingle(),
		locals.supabase
			.from('leave_requests')
			.select('id, leave_kind, start_date, end_date, day_count, status, created_at, reason')
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
			.limit(5),
		locals.supabase
			.from('wfh_requests')
			.select('id, work_date, status, created_at, reason')
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
			.limit(5),
		locals.supabase
			.from('leave_requests')
			.select('id', { count: 'exact', head: true })
			.eq('approver_id', userId)
			.eq('status', 'pending'),
		locals.supabase
			.from('wfh_requests')
			.select('id', { count: 'exact', head: true })
			.eq('approver_id', userId)
			.eq('status', 'pending'),
		locals.supabase
			.from('profiles')
			.select('id', { count: 'exact', head: true })
			.eq('reports_to', userId)
			.eq('status', 'approved')
	]);

	return {
		today,
		profile: profile ?? {
			casual_leave: 0,
			earned_leave: 0,
			reports_to: null,
			employee_id: null,
			designation: ''
		},
		todayAttendance,
		leaveRequests: leaveRequests ?? [],
		wfhRequests: wfhRequests ?? [],
		pendingApprovals: (pendingLeaveCount ?? 0) + (pendingWfhCount ?? 0),
		isManager: (reportCount ?? 0) > 0
	};
};

export const actions = {
	saveTimes: async ({ request, cookies, locals }) => {
		if (!locals.claims || !locals.profile || locals.profile.status !== 'approved') {
			return fail(401, { error: 'Sign in required.', times: true });
		}

		const formData = await request.formData();
		const workDate = String(formData.get('workDate') ?? '').trim() || todayIso();
		const inTime = normalizeTime(formData.get('inTime'));
		const outTime = normalizeTime(formData.get('outTime'));

		if (!/^\d{4}-\d{2}-\d{2}$/.test(workDate)) {
			return fail(400, { error: 'Choose a valid date.', times: true });
		}

		if (!inTime && !outTime) {
			return fail(400, { error: 'Enter an in time or out time.', times: true });
		}

		const { error: saveError } = await locals.supabase.rpc('upsert_attendance_day', {
			next_work_date: workDate,
			next_in_time: inTime,
			next_out_time: outTime
		});

		if (saveError) {
			return fail(400, {
				error:
					saveError.message?.includes('out time')
						? 'Out time must be after in time.'
						: 'Attendance times could not be saved.',
				times: true
			});
		}

		setFlash(cookies, { type: 'success', message: 'Attendance times saved.' });
		redirect(303, '/attendance');
	}
} satisfies Actions;
