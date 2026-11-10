export type TimesheetEmployee = {
	id: string;
	email: string;
	first_name: string;
	last_name: string;
	employee_id: string | null;
	designation: string;
};

export type TimesheetDayEntry = {
	user_id: string;
	work_date: string;
	in_time: string | null;
	out_time: string | null;
};

export type TimesheetWfhEntry = {
	user_id: string;
	work_date: string;
};

export type TimesheetLeaveKind = 'leave' | 'lop';

export type TimesheetLeaveEntry = {
	user_id: string;
	start_date: string;
	end_date: string;
	leave_kind: 'casual' | 'earned' | 'lop';
};

export type TimesheetCell = {
	inTime: string | null;
	outTime: string | null;
	label: string;
	wfh: boolean;
	/** Paid casual/earned leave for the day */
	leave: boolean;
	lop: boolean;
};

export type TimesheetDayMeta = {
	date: string;
	dayNumber: number;
	weekday: string;
	weekend: boolean;
	holiday: boolean;
	holidayName: string | null;
};

export type OfficeHoliday = {
	holiday_date: string;
	name: string;
};

export function monthBounds(month: string) {
	if (!/^\d{4}-\d{2}$/.test(month)) return null;
	const [yearText, monthText] = month.split('-');
	const year = Number(yearText);
	const monthIndex = Number(monthText) - 1;
	if (!Number.isInteger(year) || monthIndex < 0 || monthIndex > 11) return null;

	const end = new Date(Date.UTC(year, monthIndex + 1, 0));
	const daysInMonth = end.getUTCDate();

	const days = Array.from({ length: daysInMonth }, (_, index) => {
		const day = index + 1;
		return `${yearText}-${monthText}-${String(day).padStart(2, '0')}`;
	});

	return {
		year,
		month: monthIndex + 1,
		startDate: days[0],
		endDate: days[days.length - 1],
		days
	};
}

export function currentMonthValue(date = new Date()) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	return `${year}-${month}`;
}

export function formatClock(value: string | null | undefined) {
	if (!value) return '—';
	return value.slice(0, 5);
}

export function isWeekendDate(isoDate: string) {
	const date = new Date(`${isoDate}T00:00:00Z`);
	if (Number.isNaN(date.getTime())) return false;
	const day = date.getUTCDay();
	return day === 0 || day === 6;
}

export function weekdayShort(isoDate: string) {
	const date = new Date(`${isoDate}T00:00:00Z`);
	if (Number.isNaN(date.getTime())) return '';
	return date.toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'UTC' });
}

export function buildDayMeta(days: string[], holidays: OfficeHoliday[] = []): TimesheetDayMeta[] {
	const holidayByDate = new Map(
		holidays.map((holiday) => [holiday.holiday_date, holiday.name.trim() || 'Holiday'])
	);

	return days.map((date) => {
		const holidayName = holidayByDate.get(date) ?? null;
		return {
			date,
			dayNumber: Number(date.slice(8)),
			weekday: weekdayShort(date),
			weekend: isWeekendDate(date),
			holiday: holidayName !== null,
			holidayName
		};
	});
}

export function cellLabel(
	inTime: string | null,
	outTime: string | null,
	wfh = false,
	leave = false,
	lop = false,
	weekend = false,
	holiday = false
) {
	const times =
		!inTime && !outTime ? '' : `${formatClock(inTime)}-${formatClock(outTime)}`;
	const tags = [
		weekend ? 'Weekend' : null,
		holiday ? 'Holiday' : null,
		wfh ? 'WFH' : null,
		leave ? 'Leave' : null,
		lop ? 'LOP' : null
	].filter(Boolean);
	if (tags.length && times) return `${times} · ${tags.join(' · ')}`;
	if (tags.length) return tags.join(' · ');
	return times;
}

function expandLeaveDates(entries: TimesheetLeaveEntry[], days: string[]) {
	const daySet = new Set(days);
	const byKey = new Map<string, TimesheetLeaveKind>();

	for (const entry of entries) {
		const start = new Date(`${entry.start_date}T00:00:00Z`);
		const end = new Date(`${entry.end_date}T00:00:00Z`);
		if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
			continue;
		}

		const tag: TimesheetLeaveKind =
			entry.leave_kind === 'casual' || entry.leave_kind === 'earned' ? 'leave' : 'lop';

		for (let cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
			const iso = cursor.toISOString().slice(0, 10);
			if (!daySet.has(iso)) continue;
			const key = `${entry.user_id}:${iso}`;
			const existing = byKey.get(key);
			// Prefer paid leave over LOP if both somehow cover the same day.
			if (!existing || (existing === 'lop' && tag === 'leave')) {
				byKey.set(key, tag);
			}
		}
	}

	return byKey;
}

export function buildTimesheetMatrix(
	employees: TimesheetEmployee[],
	days: string[],
	entries: TimesheetDayEntry[],
	wfhEntries: TimesheetWfhEntry[] = [],
	leaveEntries: TimesheetLeaveEntry[] = [],
	dayMeta: TimesheetDayMeta[] = buildDayMeta(days)
) {
	const byUserDate = new Map<string, { inTime: string | null; outTime: string | null }>();
	const wfhByUserDate = new Set(
		wfhEntries.map((entry) => `${entry.user_id}:${entry.work_date}`)
	);
	const leaveByUserDate = expandLeaveDates(leaveEntries, days);
	const metaByDate = new Map(dayMeta.map((meta) => [meta.date, meta]));

	for (const entry of entries) {
		byUserDate.set(`${entry.user_id}:${entry.work_date}`, {
			inTime: entry.in_time,
			outTime: entry.out_time
		});
	}

	return employees.map((employee) => ({
		employee,
		cells: days.map((day) => {
			const key = `${employee.id}:${day}`;
			const times = byUserDate.get(key);
			const meta = metaByDate.get(day);
			const wfh = wfhByUserDate.has(key);
			const leaveTag = leaveByUserDate.get(key) ?? null;
			const leave = leaveTag === 'leave';
			const lop = leaveTag === 'lop';
			const weekend = meta?.weekend ?? false;
			const holiday = meta?.holiday ?? false;
			const inTime = times?.inTime ?? null;
			const outTime = times?.outTime ?? null;

			return {
				inTime,
				outTime,
				wfh,
				leave,
				lop,
				label: cellLabel(inTime, outTime, wfh, leave, lop, weekend, holiday)
			} satisfies TimesheetCell;
		})
	}));
}

function escapeCsv(value: string) {
	if (/[",\n\r]/.test(value)) {
		return `"${value.replaceAll('"', '""')}"`;
	}
	return value;
}

export function timesheetToCsv(
	verticalName: string,
	month: string,
	days: string[],
	rows: ReturnType<typeof buildTimesheetMatrix>
) {
	const header = [
		'Employee',
		'Employee ID',
		'Email',
		'Designation',
		...days.map((day) => day.slice(8))
	];

	const lines = [
		`Timesheet,${escapeCsv(verticalName)},${month}`,
		header.map(escapeCsv).join(','),
		...rows.map(({ employee, cells }) =>
			[
				[employee.first_name, employee.last_name].filter(Boolean).join(' ') || employee.email,
				employee.employee_id ?? '',
				employee.email,
				employee.designation,
				...cells.map((cell) => cell.label)
			]
				.map(escapeCsv)
				.join(',')
		)
	];

	return `\uFEFF${lines.join('\n')}`;
}
