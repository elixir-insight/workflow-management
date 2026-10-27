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

export type TimesheetCell = {
	inTime: string | null;
	outTime: string | null;
	label: string;
	wfh: boolean;
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

export function cellLabel(inTime: string | null, outTime: string | null, wfh = false) {
	const times =
		!inTime && !outTime ? '' : `${formatClock(inTime)}-${formatClock(outTime)}`;
	if (wfh && times) return `${times} · WFH`;
	if (wfh) return 'WFH';
	return times;
}

export function buildTimesheetMatrix(
	employees: TimesheetEmployee[],
	days: string[],
	entries: TimesheetDayEntry[],
	wfhEntries: TimesheetWfhEntry[] = []
) {
	const byUserDate = new Map<string, { inTime: string | null; outTime: string | null }>();
	const wfhByUserDate = new Set(
		wfhEntries.map((entry) => `${entry.user_id}:${entry.work_date}`)
	);

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
			const wfh = wfhByUserDate.has(key);
			const inTime = times?.inTime ?? null;
			const outTime = times?.outTime ?? null;

			return {
				inTime,
				outTime,
				wfh,
				label: cellLabel(inTime, outTime, wfh)
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
