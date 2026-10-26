import type { AppRole } from '#lib/supabase/database';

export const roles = ['admin', 'payroll', 'user'] as const satisfies readonly AppRole[];

export const roleLabels: Record<AppRole, string> = {
	admin: 'Admin',
	payroll: 'Payroll',
	user: 'User'
};

export const roleHomes: Record<AppRole, string> = {
	admin: '/admin',
	payroll: '/payroll',
	user: '/user'
};

export function isAppRole(value: unknown): value is AppRole {
	return typeof value === 'string' && roles.some((role) => role === value);
}
