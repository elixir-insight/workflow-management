import { isAppRole } from '#lib/auth/roles';
import { isAccessStatus } from '#lib/auth/status';
import type { AccessStatus, AppRole } from '#lib/supabase/database';

export function leaveBalance(value: FormDataEntryValue | null) {
	if (value === null || value === '') {
		return null;
	}

	const amount = typeof value === 'string' ? Number(value) : Number.NaN;
	if (!Number.isFinite(amount) || amount < 0) {
		return null;
	}

	return amount;
}

export type ProfileFormInput = {
	status: AccessStatus;
	role: AppRole | null;
	verticalId: string | null;
	reportsTo: string | null;
	designation: string;
	employeeId: string | null;
	casualLeave: number | null;
	earnedLeave: number | null;
	firstName: string;
	lastName: string;
	phone: string;
	presentAddress: string;
	timesheetExempt: boolean;
};

export function readProfileForm(formData: FormData): ProfileFormInput | { error: string } {
	const statusValue = formData.get('status');
	if (!isAccessStatus(statusValue)) {
		return { error: 'Choose pending, approved, or denied.' };
	}

	const roleValue = formData.get('role');
	const role = isAppRole(roleValue) ? roleValue : null;
	const verticalId = String(formData.get('verticalId') ?? '').trim() || null;
	const reportsTo = String(formData.get('reportsTo') ?? '').trim() || null;
	const designation = String(formData.get('designation') ?? '').trim();
	const employeeId = String(formData.get('employeeId') ?? '').trim() || null;
	const casualLeave = leaveBalance(formData.get('casualLeave'));
	const earnedLeave = leaveBalance(formData.get('earnedLeave'));
	const firstName = String(formData.get('firstName') ?? '').trim();
	const lastName = String(formData.get('lastName') ?? '').trim();
	const phone = String(formData.get('phone') ?? '').trim();
	const presentAddress = String(formData.get('presentAddress') ?? '').trim();
	const timesheetExempt = formData.get('timesheetExempt') === 'true';

	if (employeeId && !/^[A-Za-z0-9][A-Za-z0-9._/-]{0,31}$/.test(employeeId)) {
		return { error: 'Employee ID can use letters, numbers, and . _ / - (max 32).' };
	}

	if (phone && !/^[\d+\-\s().]{7,20}$/.test(phone)) {
		return { error: 'Enter a valid phone number.' };
	}

	if (presentAddress.length > 500) {
		return { error: 'Address is too long.' };
	}

	if (statusValue === 'approved') {
		if (!role || !verticalId || !designation) {
			return { error: 'Approved users need a role, vertical, and designation.' };
		}

		if (casualLeave === null || earnedLeave === null) {
			return { error: 'Enter leave balances for an approved user.' };
		}
	}

	return {
		status: statusValue,
		role,
		verticalId,
		reportsTo,
		designation,
		employeeId,
		casualLeave,
		earnedLeave,
		firstName,
		lastName,
		phone,
		presentAddress,
		timesheetExempt
	};
}
