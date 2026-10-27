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
			'id, email, first_name, last_name, employee_id, status, role, designation, casual_leave, earned_leave, created_at, vertical_id'
		)
		.neq('email', platformAdminEmail)
		.order('email');

	query = unassigned ? query.is('vertical_id', null) : query.eq('vertical_id', params.verticalId);

	const { data: users, error: usersError } = await query;

	return {
		vertical,
		users: users ?? [],
		loadError: usersError ? 'People in this vertical could not be loaded.' : null
	};
};
