export const requestStatuses = ['pending', 'approved', 'rejected'] as const;

export type RequestStatus = (typeof requestStatuses)[number];

export const requestStatusLabels: Record<RequestStatus, string> = {
	pending: 'Pending',
	approved: 'Approved',
	rejected: 'Rejected'
};

export function isRequestStatus(value: unknown): value is RequestStatus {
	return typeof value === 'string' && requestStatuses.some((status) => status === value);
}
