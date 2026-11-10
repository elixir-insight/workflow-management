import { clockedHours, formatHours } from '#lib/attendance/hours';
import { isPlatformAdminEmail } from '#lib/auth/platform-admin';
import { setFlash } from '#lib/server/flash';
import { error, fail, redirect } from '@sveltejs/kit';
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

function isValidWorkDate(value: string, today = todayIso()) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	return value <= today;
}

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.claims || !locals.profile || locals.profile.status !== 'approved') {
		error(401, 'Sign in required');
	}

	const userId = locals.claims.sub;
	const orgWideApprovals = isPlatformAdminEmail(locals.claims.email);
	const today = todayIso();
	const requestedDate = url.searchParams.get('date')?.trim() || today;
	const selectedDate = isValidWorkDate(requestedDate, today) ? requestedDate : today;

	const recentFrom = (() => {
		const date = new Date(`${today}T00:00:00Z`);
		date.setUTCDate(date.getUTCDate() - 29);
		return date.toISOString().slice(0, 10);
	})();

	const pendingLeaveQuery = locals.supabase
		.from('leave_requests')
		.select('id', { count: 'exact', head: true })
		.eq('status', 'pending');
	const pendingWfhQuery = locals.supabase
		.from('wfh_requests')
		.select('id', { count: 'exact', head: true })
		.eq('status', 'pending');

	if (!orgWideApprovals) {
		pendingLeaveQuery.eq('approver_id', userId);
		pendingWfhQuery.eq('approver_id', userId);
	}

	const [
		{ data: profile },
		{ data: selectedAttendance },
		{ data: recentAttendance },
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
			.eq('work_date', selectedDate)
			.maybeSingle(),
		locals.supabase
			.from('attendance_days')
			.select('work_date, in_time, out_time')
			.eq('user_id', userId)
			.gte('work_date', recentFrom)
			.lte('work_date', today)
			.order('work_date', { ascending: false }),
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
		pendingLeaveQuery,
		pendingWfhQuery,
		locals.supabase
			.from('profiles')
			.select('id', { count: 'exact', head: true })
			.eq('reports_to', userId)
			.eq('status', 'approved')
	]);

	const recentDays = (recentAttendance ?? []).map((day) => {
		const hours = clockedHours(day.in_time, day.out_time);
		return {
			work_date: day.work_date,
			in_time: day.in_time,
			out_time: day.out_time,
			hoursLabel: formatHours(hours)
		};
	});

	return {
		today,
		selectedDate,
		isToday: selectedDate === today,
		profile: profile ?? {
			casual_leave: 0,
			earned_leave: 0,
			reports_to: null,
			employee_id: null,
			designation: ''
		},
		selectedAttendance,
		recentDays,
		leaveRequests: leaveRequests ?? [],
		wfhRequests: wfhRequests ?? [],
		pendingApprovals: (pendingLeaveCount ?? 0) + (pendingWfhCount ?? 0),
		isManager: orgWideApprovals || (reportCount ?? 0) > 0
	};
};

export const actions = {
	saveTimes: async ({ request, cookies, locals }) => {
		const formData = await request.formData();
		const today = todayIso();
		const workDate = String(formData.get('workDate') ?? '').trim() || today;
		const inTime = normalizeTime(formData.get('inTime'));
		const outTime = normalizeTime(formData.get('outTime'));
		const values = { times: true as const, workDate };

		if (!locals.claims || !locals.profile || locals.profile.status !== 'approved') {
			return fail(401, { error: 'Sign in required.', ...values });
		}

		if (!isValidWorkDate(workDate, today)) {
			return fail(400, {
				error: 'Choose today or an earlier date.',
				...values
			});
		}

		if (!inTime && !outTime) {
			return fail(400, {
				error: 'Enter an in time or out time.',
				...values
			});
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
				...values
			});
		}

		setFlash(cookies, {
			type: 'success',
			message:
				workDate === today
					? 'Attendance times saved for today.'
					: `Attendance times saved for ${workDate}.`
		});
		redirect(303, `/attendance?date=${workDate}`);
	}
} satisfies Actions;
