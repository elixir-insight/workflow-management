import { platformAdminEmail } from '#lib/auth/platform-admin';
import type { Database, RequestStatus } from '#lib/supabase/database';
import type { SupabaseClient } from '@supabase/supabase-js';

type Client = SupabaseClient<Database>;

export type PersonalLeaveRequest = {
	id: string;
	leave_kind: Database['public']['Enums']['leave_kind'];
	start_date: string;
	end_date: string;
	day_count: number;
	status: RequestStatus;
	created_at: string;
	reason: string;
};

export type PersonalWfhRequest = {
	id: string;
	work_date: string;
	status: RequestStatus;
	created_at: string;
	reason: string;
};

export type PersonalDashboard = {
	today: string;
	profile: {
		casual_leave: number;
		earned_leave: number;
		reports_to: string | null;
		employee_id: string | null;
		designation: string;
		first_name: string;
		last_name: string;
		phone: string;
		present_address: string;
		avatar_path: string | null;
	};
	todayAttendance: {
		id: string;
		work_date: string;
		in_time: string | null;
		out_time: string | null;
	} | null;
	leaveRequests: PersonalLeaveRequest[];
	wfhRequests: PersonalWfhRequest[];
	pendingApprovals: number;
	isManager: boolean;
	profileGaps: string[];
};

function todayIso() {
	return new Date().toISOString().slice(0, 10);
}

function profileGaps(profile: PersonalDashboard['profile']): string[] {
	const gaps: string[] = [];
	if (!profile.first_name.trim()) gaps.push('First name');
	if (!profile.last_name.trim()) gaps.push('Last name');
	if (!profile.designation.trim()) gaps.push('Designation');
	if (!profile.phone.trim()) gaps.push('Phone');
	if (!profile.present_address.trim()) gaps.push('Present address');
	if (!profile.avatar_path) gaps.push('Photo');
	return gaps;
}

export async function loadPersonalDashboard(
	supabase: Client,
	userId: string
): Promise<PersonalDashboard> {
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
		supabase
			.from('profiles')
			.select(
				'casual_leave, earned_leave, reports_to, employee_id, designation, first_name, last_name, phone, present_address, avatar_path'
			)
			.eq('id', userId)
			.maybeSingle(),
		supabase
			.from('attendance_days')
			.select('id, work_date, in_time, out_time')
			.eq('user_id', userId)
			.eq('work_date', today)
			.maybeSingle(),
		supabase
			.from('leave_requests')
			.select('id, leave_kind, start_date, end_date, day_count, status, created_at, reason')
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
			.limit(5),
		supabase
			.from('wfh_requests')
			.select('id, work_date, status, created_at, reason')
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
			.limit(5),
		supabase
			.from('leave_requests')
			.select('id', { count: 'exact', head: true })
			.eq('approver_id', userId)
			.eq('status', 'pending'),
		supabase
			.from('wfh_requests')
			.select('id', { count: 'exact', head: true })
			.eq('approver_id', userId)
			.eq('status', 'pending'),
		supabase
			.from('profiles')
			.select('id', { count: 'exact', head: true })
			.eq('reports_to', userId)
			.eq('status', 'approved')
			.neq('email', platformAdminEmail)
	]);

	const resolvedProfile = profile ?? {
		casual_leave: 0,
		earned_leave: 0,
		reports_to: null,
		employee_id: null,
		designation: '',
		first_name: '',
		last_name: '',
		phone: '',
		present_address: '',
		avatar_path: null
	};

	return {
		today,
		profile: resolvedProfile,
		todayAttendance,
		leaveRequests: leaveRequests ?? [],
		wfhRequests: wfhRequests ?? [],
		pendingApprovals: (pendingLeaveCount ?? 0) + (pendingWfhCount ?? 0),
		isManager: (reportCount ?? 0) > 0,
		profileGaps: profileGaps(resolvedProfile)
	};
}
