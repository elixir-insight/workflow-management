import { platformAdminEmail } from '#lib/auth/platform-admin';
import {
	buildDayMeta,
	buildTimesheetMatrix,
	monthBounds,
	timesheetToCsv,
	type OfficeHoliday,
	type TimesheetDayEntry,
	type TimesheetEmployee,
	type TimesheetLopEntry,
	type TimesheetWfhEntry
} from '#lib/attendance/timesheet';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

function canAccessTimesheet(role: string | null | undefined) {
	return role === 'admin' || role === 'payroll';
}

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.claims || !locals.profile || locals.profile.status !== 'approved') {
		error(401, 'Sign in required');
	}

	if (!canAccessTimesheet(locals.profile.role)) {
		error(403, 'Timesheet export is only available to admin and payroll.');
	}

	const verticalId = url.searchParams.get('verticalId');
	const monthParam = url.searchParams.get('month');

	if (!verticalId || !monthParam) {
		error(400, 'verticalId and month are required.');
	}

	const month = monthParam;
	const bounds = monthBounds(month);
	if (!bounds) {
		error(400, 'Invalid month.');
	}

	const [{ data: vertical }, { data: employees }, { data: holidayRows }] = await Promise.all([
		locals.supabase.from('verticals').select('id, name').eq('id', verticalId).maybeSingle(),
		locals.supabase
			.from('profiles')
			.select('id, email, first_name, last_name, employee_id, designation')
			.eq('vertical_id', verticalId)
			.eq('status', 'approved')
			.eq('timesheet_exempt', false)
			.neq('email', platformAdminEmail)
			.order('email'),
		locals.supabase
			.from('office_holidays')
			.select('holiday_date, name')
			.gte('holiday_date', bounds.startDate)
			.lte('holiday_date', bounds.endDate)
	]);

	if (!vertical) {
		error(404, 'Vertical not found');
	}

	const people = (employees ?? []) as TimesheetEmployee[];
	const employeeIds = people.map((person) => person.id);
	const dayMeta = buildDayMeta(bounds.days, (holidayRows ?? []) as OfficeHoliday[]);

	let entries: TimesheetDayEntry[] = [];
	let wfhEntries: TimesheetWfhEntry[] = [];
	let lopEntries: TimesheetLopEntry[] = [];

	if (employeeIds.length > 0) {
		const [
			{ data: attendance, error: attendanceError },
			{ data: wfhRows, error: wfhError },
			{ data: lopRows, error: lopError }
		] = await Promise.all([
			locals.supabase
				.from('attendance_days')
				.select('user_id, work_date, in_time, out_time')
				.in('user_id', employeeIds)
				.gte('work_date', bounds.startDate)
				.lte('work_date', bounds.endDate),
			locals.supabase
				.from('wfh_requests')
				.select('user_id, work_date')
				.in('user_id', employeeIds)
				.eq('status', 'approved')
				.gte('work_date', bounds.startDate)
				.lte('work_date', bounds.endDate),
			locals.supabase
				.from('leave_requests')
				.select('user_id, start_date, end_date')
				.in('user_id', employeeIds)
				.eq('status', 'approved')
				.eq('leave_kind', 'lop')
				.lte('start_date', bounds.endDate)
				.gte('end_date', bounds.startDate)
		]);

		if (attendanceError || wfhError || lopError) {
			error(500, 'Timesheet data could not be loaded.');
		}

		entries = (attendance ?? []) as TimesheetDayEntry[];
		wfhEntries = (wfhRows ?? []) as TimesheetWfhEntry[];
		lopEntries = (lopRows ?? []) as TimesheetLopEntry[];
	}

	const rows = buildTimesheetMatrix(
		people,
		bounds.days,
		entries,
		wfhEntries,
		lopEntries,
		dayMeta
	);
	const safeName = vertical.name.replace(/[^\w.-]+/g, '_');
	const filename = `timesheet_${safeName}_${month}`;
	const body = timesheetToCsv(vertical.name, month, bounds.days, rows);

	return new Response(body, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="${filename}.csv"`
		}
	});
};
