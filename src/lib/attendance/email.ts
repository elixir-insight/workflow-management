import { profileDisplayName } from '#lib/profile/display';

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
	leaveKind: 'casual' | 'earned';
	startDate: string;
	endDate: string;
	dayCount: number;
	reason: string;
};

const leaveKindLabel = {
	casual: 'Casual Leave',
	earned: 'Earned Leave'
} as const;

function formatDate(isoDate: string) {
	const date = new Date(`${isoDate}T00:00:00`);
	if (Number.isNaN(date.getTime())) return isoDate;
	return date.toLocaleDateString('en-IN', {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});
}

export function buildLeaveEmail(input: LeaveEmailInput) {
	const applicantName = profileDisplayName(input.applicant);
	const managerName = input.manager
		? profileDisplayName({
				first_name: input.manager.first_name,
				last_name: input.manager.last_name,
				email: input.manager.email
			})
		: 'Reporting Lead';

	const managerEmail = input.manager?.email?.trim() || '[reporting-lead@company.com]';
	const dateLine =
		input.startDate === input.endDate
			? formatDate(input.startDate)
			: `${formatDate(input.startDate)} to ${formatDate(input.endDate)}`;

	const subject = `Leave Request · ${applicantName} · ${dateLine}`;

	const body = [
		`To: ${managerEmail}`,
		`Subject: ${subject}`,
		'',
		`Hi ${managerName},`,
		'',
		`I would like to apply for ${leaveKindLabel[input.leaveKind]} for ${dateLine} (${input.dayCount} day${input.dayCount === 1 ? '' : 's'}).`,
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

export function inclusiveDayCount(startDate: string, endDate: string) {
	const start = new Date(`${startDate}T00:00:00Z`);
	const end = new Date(`${endDate}T00:00:00Z`);
	if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
		return null;
	}

	const ms = end.getTime() - start.getTime();
	return Math.floor(ms / 86_400_000) + 1;
}
