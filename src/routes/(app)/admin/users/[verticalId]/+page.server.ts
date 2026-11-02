import { platformAdminEmail } from '#lib/auth/platform-admin';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const unassigned = params.verticalId === 'pending';

	const vertical = unassigned
		? { id: 'pending', name: 'Unassigned' }
		: (
				await locals.supabase
					.from('verticals')
					.select('id, name')
					.eq('id', params.verticalId)
					.maybeSingle()
			).data;

	if (!vertical) {
		error(404, 'Vertical not found');
	}

	let query = locals.supabase
		.from('profiles')
		.select(
			'id, email, first_name, last_name, employee_id, status, role, designation, casual_leave, earned_leave, created_at, vertical_id, reports_to, timesheet_exempt'
		)
		.neq('email', platformAdminEmail)
		.order('email');

	query = unassigned ? query.is('vertical_id', null) : query.eq('vertical_id', params.verticalId);

	const { data: users, error: usersError } = await query;
	const people = users ?? [];

	const managerIds = [
		...new Set(people.map((person) => person.reports_to).filter((id): id is string => Boolean(id)))
	];

	const { data: managers } = managerIds.length
		? await locals.supabase
				.from('profiles')
				.select('id, email, first_name, last_name')
				.in('id', managerIds)
		: { data: [] as const };

	const managersById = new Map((managers ?? []).map((manager) => [manager.id, manager]));

	return {
		vertical,
		users: people.map((person) => {
			const manager = person.reports_to ? managersById.get(person.reports_to) : null;
			return {
				...person,
				reportsToName: manager
					? [manager.first_name, manager.last_name].filter(Boolean).join(' ').trim() ||
						manager.email
					: null,
				reportsToEmail: manager?.email ?? null
			};
		}),
		loadError: usersError ? 'People in this vertical could not be loaded.' : null
	};
};
