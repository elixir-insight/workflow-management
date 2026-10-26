import { isAppRole } from '#lib/auth/roles';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

function leaveBalance(value: FormDataEntryValue | null) {
	const amount = typeof value === 'string' ? Number(value) : Number.NaN;
	if (!Number.isFinite(amount) || amount < 0) {
		return null;
	}

	return amount;
}

export const load: PageServerLoad = async ({ locals }) => {
	const [{ data: requests, error }, { data: managers }] = await Promise.all([
		locals.supabase
			.from('profiles')
			.select('id, email, created_at')
			.eq('status', 'pending')
			.order('created_at', { ascending: true }),
		locals.supabase
			.from('profiles')
			.select('id, email, designation')
			.eq('status', 'approved')
			.order('email', { ascending: true })
	]);

	return {
		requests: requests ?? [],
		managers: managers ?? [],
		loadError: error ? 'Approval requests could not be loaded.' : null
	};
};

export const actions = {
	approve: async ({ request, locals }) => {
		const formData = await request.formData();
		const target = String(formData.get('id') ?? '');
		const roleValue = formData.get('role');
		const reportsTo = String(formData.get('reportsTo') ?? '');
		const designation = String(formData.get('designation') ?? '').trim();
		const casualLeave = leaveBalance(formData.get('casualLeave'));
		const sickLeave = leaveBalance(formData.get('sickLeave'));
		const earnedLeave = leaveBalance(formData.get('earnedLeave'));

		if (
			!isAppRole(roleValue) ||
			!designation ||
			casualLeave === null ||
			sickLeave === null ||
			earnedLeave === null
		) {
			return fail(400, {
				error: 'Choose a role, designation, and leave balances.',
				id: target
			});
		}

		const { error } = await locals.supabase.rpc('approve_profile', {
			target,
			next_role: roleValue,
			next_reports_to: reportsTo || null,
			next_designation: designation,
			next_casual: casualLeave,
			next_sick: sickLeave,
			next_earned: earnedLeave
		});

		if (error) {
			return fail(400, {
				error: 'This request could not be approved.',
				id: target
			});
		}

		return { approved: target };
	}
} satisfies Actions;
