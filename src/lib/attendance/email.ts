import { profileDisplayName } from '#lib/profile/display';

export type LeaveKindEmail = 'casual' | 'earned' | 'lop';

export type LeaveEmailInput = {
	applicant: {
		first_name?: string | null;
		last_name?: string | null;
		email: string;
		employee_id?: string | null;
		designation?: string | null;
	};
	manager: {
		first_name?: string | null;
		last_name?: string | null;
		email?: string | null;
	} | null;
	leaveKind: LeaveKindEmail;
	requestedKind?: LeaveKindEmail;
	startDate: string;
	endDate: string;
	dayCount: number;
	reason: string;
};

export type WfhEmailInput = {
	applicant: {
		first_name?: string | null;
		last_name?: string | null;
		email: string;
		employee_id?: string | null;
		designation?: string | null;
	};
	manager: {
		first_name?: string | null;
		last_name?: string | null;
		email?: string | null;
	} | null;
	workDate: string;
	reason: string;
};

const leaveKindLabel = {
	casual: 'Casual Leave',
	earned: 'Earned Leave',
	lop: 'Loss of Pay (LOP)'
} as const;

const reportingLeadPlaceholder = '[reporting-lead@company.com]';

function formatDate(isoDate: string) {
	const date = new Date(`${isoDate}T00:00:00`);
	if (Number.isNaN(date.getTime())) return isoDate;
	return date.toLocaleDateString('en-IN', {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});
}

function managerFields(manager: LeaveEmailInput['manager'] | WfhEmailInput['manager']) {
	const managerName = manager
		? profileDisplayName({
				first_name: manager.first_name,
				last_name: manager.last_name,
				email: manager.email
			})
		: 'Reporting Lead';
	const managerEmail = manager?.email?.trim() || reportingLeadPlaceholder;
	return { managerName, managerEmail };
}

export function buildLeaveEmail(input: LeaveEmailInput) {
	const applicantName = profileDisplayName(input.applicant);
	const { managerName, managerEmail } = managerFields(input.manager);
	const effectiveKind = input.leaveKind;
	const requested = input.requestedKind ?? effectiveKind;
	const dateLine =
		input.startDate === input.endDate
			? formatDate(input.startDate)
			: `${formatDate(input.startDate)} to ${formatDate(input.endDate)}`;

	const subject = `Leave Request · ${applicantName} · ${dateLine}`;
	const convertedNote =
		effectiveKind === 'lop' && requested !== 'lop'
			? `Note: This is marked as Loss of Pay (LOP) because available ${leaveKindLabel[requested as 'casual' | 'earned']} balance was insufficient.`
			: null;

	const body = [
		`To: ${managerEmail}`,
		`Subject: ${subject}`,
		'',
		`Hi ${managerName},`,
		'',
		`I would like to apply for ${leaveKindLabel[effectiveKind]} for ${dateLine} (${input.dayCount} day${input.dayCount === 1 ? '' : 's'}).`,
		convertedNote,
		'',
		`Reason: ${input.reason.trim() || '—'}`,
		'',
		'Please approve this leave request.',
		'',
		'Regards,',
		applicantName,
		input.applicant.designation?.trim() || null,
		input.applicant.employee_id ? `Employee ID: ${input.applicant.employee_id}` : null,
		input.applicant.email
	]
		.filter((line) => line !== null)
		.join('\n');

	return { subject, body, managerEmail };
}

export function buildWfhEmail(input: WfhEmailInput) {
	const applicantName = profileDisplayName(input.applicant);
	const { managerName, managerEmail } = managerFields(input.manager);
	const dateLine = formatDate(input.workDate);
	const subject = `WFH Request · ${applicantName} · ${dateLine}`;

	const body = [
		`To: ${managerEmail}`,
		`Subject: ${subject}`,
		'',
		`Hi ${managerName},`,
		'',
		`I would like to work from home on ${dateLine}.`,
		'',
		`Reason: ${input.reason.trim() || '—'}`,
		'',
		'Please approve this WFH request.',
		'',
		'Regards,',
		applicantName,
		input.applicant.designation?.trim() || null,
		input.applicant.employee_id ? `Employee ID: ${input.applicant.employee_id}` : null,
		input.applicant.email
	]
		.filter((line) => line !== null)
		.join('\n');

	return { subject, body, managerEmail };
}

export function inclusiveDayCount(startDate: string, endDate: string) {
	const start = new Date(`${startDate}T00:00:00Z`);
	const end = new Date(`${endDate}T00:00:00Z`);
	if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
		return null;
	}

	const ms = end.getTime() - start.getTime();
	return Math.floor(ms / 86_400_000) + 1;
}
