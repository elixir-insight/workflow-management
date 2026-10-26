import type { AppRole } from '#lib/supabase/database';

export const roles = ['employee', 'admin', 'hr'] as const satisfies readonly AppRole[];

export const roleLabels: Record<AppRole, string> = {
	employee: 'Employee',
	admin: 'Admin',
	hr: 'HR'
};

export const roleHomes: Record<AppRole, string> = {
	employee: '/employee',
	admin: '/admin',
	hr: '/hr'
};

export function isAppRole(value: unknown): value is AppRole {
	return typeof value === 'string' && roles.some((role) => role === value);
}
