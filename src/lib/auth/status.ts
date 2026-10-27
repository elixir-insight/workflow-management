import type { AccessStatus } from '#lib/supabase/database';

export const accessStatuses = [
	'pending',
	'approved',
	'denied'
] as const satisfies readonly AccessStatus[];

export const accessStatusLabels: Record<AccessStatus, string> = {
	pending: 'Pending',
	approved: 'Approved',
	denied: 'Denied'
};

export const accessStatusDotClass: Record<AccessStatus, string> = {
	pending: 'bg-amber',
	approved: 'bg-success',
	denied: 'bg-orange'
};

export function isAccessStatus(value: unknown): value is AccessStatus {
	return typeof value === 'string' && accessStatuses.some((status) => status === value);
}
