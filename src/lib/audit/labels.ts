export const auditActionLabels: Record<string, string> = {
	'profile.create': 'Account created',
	'profile.update': 'Profile updated',
	'profile.delete': 'User deleted',
	'vertical.create': 'Vertical created',
	'vertical.update': 'Vertical updated',
	'vertical.delete': 'Vertical deleted',
	'leave.create': 'Leave requested',
	'leave.decide': 'Leave decided',
	'wfh.create': 'WFH requested',
	'wfh.decide': 'WFH decided',
	'attendance.create': 'Attendance logged',
	'attendance.update': 'Attendance updated'
};

export const auditFieldLabels: Record<string, string> = {
	role: 'Role',
	status: 'Status',
	designation: 'Designation',
	casual_leave: 'Casual leave',
	earned_leave: 'Earned leave',
	employee_id: 'Employee ID',
	vertical: 'Vertical',
	reports_to: 'Reports to',
	first_name: 'First name',
	last_name: 'Last name',
	phone: 'Phone',
	present_address: 'Address',
	avatar_path: 'Photo',
	name: 'Name',
	leave_kind: 'Leave type',
	start_date: 'Start date',
	end_date: 'End date',
	day_count: 'Days',
	work_date: 'Work date',
	in_time: 'In time',
	out_time: 'Out time',
	email: 'Email'
};

export function auditActionLabel(action: string) {
	return auditActionLabels[action] ?? action;
}

export function auditFieldLabel(field: string) {
	return auditFieldLabels[field] ?? field.replaceAll('_', ' ');
}

export function formatAuditValue(value: unknown) {
	if (value === null || value === undefined || value === '') return '—';
	if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
		return String(value);
	}
	return JSON.stringify(value);
}
