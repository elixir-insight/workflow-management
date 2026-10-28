import { platformAdminEmail } from '#lib/auth/platform-admin';
import {
	buildTimesheetMatrix,
	currentMonthValue,
	monthBounds,
	type TimesheetDayEntry,
	type TimesheetEmployee,
	type TimesheetLopEntry,
	type TimesheetWfhEntry
} from '#lib/attendance/timesheet';
import { profileDisplayName } from '#lib/profile/display';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

function canAccessTimesheet(role: string | null | undefined) {
	return role === 'admin' || role === 'payroll';
}

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.claims || !locals.profile || locals.profile.status !== 'approved') {
		error(401, 'Sign in required');
	}

	if (!canAccessTimesheet(locals.profile.role)) {
		error(403, 'Timesheet is only available to admin and payroll.');
	}

	const month = url.searchParams.get('month') || currentMonthValue();
	const bounds = monthBounds(month);
	if (!bounds) {
		error(400, 'Invalid month.');
	}

	const { data: verticals, error: verticalError } = await locals.supabase
		.from('verticals')
		.select('id, name')
		.order('name');

	if (verticalError) {
		error(500, 'Verticals could not be loaded.');
	}

	const requestedVertical = url.searchParams.get('verticalId');
	const selectedVertical =
		(verticals ?? []).find((vertical) => vertical.id === requestedVertical) ??
		(verticals ?? [])[0] ??
		null;

	if (!selectedVertical) {
		return {
			month,
			monthLabel: bounds.startDate.slice(0, 7),
			days: bounds.days,
			verticals: [],
			selectedVertical: null,
			rows: [],
			employeeCount: 0
		};
	}

	const { data: employees, error: employeeError } = await locals.supabase
		.from('profiles')
		.select('id, email, first_name, last_name, employee_id, designation')
		.eq('vertical_id', selectedVertical.id)
		.eq('status', 'approved')
		.neq('email', platformAdminEmail)
		.order('email');

	if (employeeError) {
		error(500, 'Employees could not be loaded.');
	}

	const people = (employees ?? []) as TimesheetEmployee[];
	const employeeIds = people.map((person) => person.id);

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

		if (attendanceError) {
			error(500, 'Attendance times could not be loaded.');
		}

		if (wfhError) {
			error(500, 'WFH data could not be loaded.');
		}

		if (lopError) {
			error(500, 'LOP leave data could not be loaded.');
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
		lopEntries
	).map((row) => ({
		...row,
		displayName: profileDisplayName(row.employee)
	}));

	return {
		month,
		monthLabel: new Date(`${bounds.startDate}T00:00:00Z`).toLocaleDateString('en-IN', {
			month: 'long',
			year: 'numeric',
			timeZone: 'UTC'
		}),
		days: bounds.days,
		verticals: verticals ?? [],
		selectedVertical,
		rows,
		employeeCount: people.length
	};
};
