import { platformAdminEmail } from '#lib/auth/platform-admin';
import type { AccessStatus, Database } from '#lib/supabase/database';
import type { SupabaseClient } from '@supabase/supabase-js';

type Client = SupabaseClient<Database>;

export type PayrollPersonAttention = {
	id: string;
	email: string;
	first_name: string;
	last_name: string;
	employee_id: string | null;
	vertical_id: string | null;
	vertical_name: string | null;
	issues: string[];
};

export type PayrollDashboard = {
	today: string;
	monthLabel: string;
	people: {
		total: number;
		approved: number;
		pending: number;
		denied: number;
		unassigned: number;
		missingEmployeeId: number;
	};
	verticalCount: number;
	todayPunches: number;
	monthAttendanceDays: number;
	pendingLeave: number;
	pendingWfh: number;
	attention: PayrollPersonAttention[];
	loadError: string | null;
};

function todayIso() {
	return new Date().toISOString().slice(0, 10);
}

function monthBounds(date = new Date()) {
	const year = date.getFullYear();
	const month = date.getMonth();
	const start = new Date(Date.UTC(year, month, 1));
	const end = new Date(Date.UTC(year, month + 1, 0));
	const pad = (n: number) => String(n).padStart(2, '0');
	return {
		start: `${start.getUTCFullYear()}-${pad(start.getUTCMonth() + 1)}-${pad(start.getUTCDate())}`,
		end: `${end.getUTCFullYear()}-${pad(end.getUTCMonth() + 1)}-${pad(end.getUTCDate())}`,
		label: date.toLocaleString('en-IN', { month: 'long', year: 'numeric' })
	};
}

export async function loadPayrollDashboard(supabase: Client): Promise<PayrollDashboard> {
	const today = todayIso();
	const month = monthBounds();

	const [
		{ data: verticals, error: verticalError },
		{ data: profiles, error: profileError },
		{ count: todayPunches, error: punchError },
		{ count: monthAttendanceDays, error: monthError },
		{ count: pendingLeave, error: leaveError },
		{ count: pendingWfh, error: wfhError }
	] = await Promise.all([
		supabase.from('verticals').select('id, name').order('name'),
		supabase
			.from('profiles')
			.select('id, email, first_name, last_name, employee_id, status, vertical_id')
			.neq('email', platformAdminEmail),
		supabase
			.from('attendance_days')
			.select('id', { count: 'exact', head: true })
			.eq('work_date', today),
		supabase
			.from('attendance_days')
			.select('id', { count: 'exact', head: true })
			.gte('work_date', month.start)
			.lte('work_date', month.end),
		supabase
			.from('leave_requests')
			.select('id', { count: 'exact', head: true })
			.eq('status', 'pending'),
		supabase
			.from('wfh_requests')
			.select('id', { count: 'exact', head: true })
			.eq('status', 'pending')
	]);

	const verticalNames = new Map((verticals ?? []).map((v) => [v.id, v.name]));

	const people = {
		total: 0,
		approved: 0,
		pending: 0,
		denied: 0,
		unassigned: 0,
		missingEmployeeId: 0
	};

	const attention: PayrollPersonAttention[] = [];

	for (const profile of profiles ?? []) {
		people.total += 1;
		const status = profile.status as AccessStatus;
		if (status === 'approved') people.approved += 1;
		else if (status === 'pending') people.pending += 1;
		else if (status === 'denied') people.denied += 1;

		if (!profile.vertical_id) people.unassigned += 1;

		if (status !== 'approved') continue;

		const issues: string[] = [];
		if (!profile.employee_id?.trim()) {
			people.missingEmployeeId += 1;
			issues.push('Missing employee ID');
		}
		if (!profile.vertical_id) {
			issues.push('No vertical');
		}
		if (!profile.first_name.trim() || !profile.last_name.trim()) {
			issues.push('Incomplete name');
		}

		if (issues.length > 0 && attention.length < 8) {
			attention.push({
				id: profile.id,
				email: profile.email,
				first_name: profile.first_name,
				last_name: profile.last_name,
				employee_id: profile.employee_id,
				vertical_id: profile.vertical_id,
				vertical_name: profile.vertical_id
					? (verticalNames.get(profile.vertical_id) ?? null)
					: null,
				issues
			});
		}
	}

	return {
		today,
		monthLabel: month.label,
		people,
		verticalCount: (verticals ?? []).length,
		todayPunches: todayPunches ?? 0,
		monthAttendanceDays: monthAttendanceDays ?? 0,
		pendingLeave: pendingLeave ?? 0,
		pendingWfh: pendingWfh ?? 0,
		attention,
		loadError:
			verticalError || profileError || punchError || monthError || leaveError || wfhError
				? 'Payroll dashboard could not be fully loaded.'
				: null
	};
}
