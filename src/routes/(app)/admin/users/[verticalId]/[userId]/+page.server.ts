import { isPlatformAdminEmail, platformAdminEmail } from '#lib/auth/platform-admin';
import { setFlash } from '#lib/server/flash';
import { leaveBalance, readProfileForm } from '#lib/server/profile-form';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.claims || !locals.profile || locals.profile.status !== 'approved') {
		error(401, 'Sign in required');
	}

	const canEditAll = locals.profile.role === 'admin';
	const canEditLeave =
		locals.profile.role === 'admin' || locals.profile.role === 'payroll';

	if (!canEditLeave) {
		error(403, 'Not allowed');
	}

	const [{ data: profile, error: profileError }, { data: verticals }, { data: managers }] =
		await Promise.all([
			locals.supabase
				.from('profiles')
				.select(
					'id, email, first_name, last_name, status, role, designation, employee_id, casual_leave, earned_leave, reports_to, vertical_id, created_at'
				)
				.eq('id', params.userId)
				.maybeSingle(),
			locals.supabase.from('verticals').select('id, name').order('name'),
			locals.supabase
				.from('profiles')
				.select('id, email, first_name, last_name, designation')
				.eq('status', 'approved')
				.neq('id', params.userId)
				.neq('email', platformAdminEmail)
				.order('email')
		]);

	if (profileError) {
		error(500, 'This profile could not be loaded.');
	}

	if (!profile || isPlatformAdminEmail(profile.email)) {
		error(404, 'Person not found');
	}

	const expectedVertical = profile.vertical_id ?? 'pending';
	if (params.verticalId !== expectedVertical) {
		redirect(303, `/admin/users/${expectedVertical}/${profile.id}`);
	}

	const vertical =
		params.verticalId === 'pending'
			? { id: 'pending', name: 'Unassigned' }
			: ((verticals ?? []).find((item) => item.id === params.verticalId) ?? null);

	if (!vertical) {
		error(404, 'Vertical not found');
	}

	return {
		vertical,
		profile,
		verticals: verticals ?? [],
		managers: managers ?? [],
		canEditAll,
		canDelete: canEditAll
	};
};

export const actions = {
	save: async ({ request, cookies, locals }) => {
		if (!locals.claims || !locals.profile || locals.profile.status !== 'approved') {
			return fail(401, { error: 'Sign in required.' });
		}

		const formData = await request.formData();
		const target = String(formData.get('id') ?? '');

		const { data: targetProfile } = await locals.supabase
			.from('profiles')
			.select('email, vertical_id')
			.eq('id', target)
			.maybeSingle();

		if (!targetProfile || isPlatformAdminEmail(targetProfile.email)) {
			return fail(404, { error: 'Person not found' });
		}

		if (locals.profile.role === 'payroll') {
			const casualLeave = leaveBalance(formData.get('casualLeave'));
			const earnedLeave = leaveBalance(formData.get('earnedLeave'));

			if (casualLeave === null || earnedLeave === null) {
				return fail(400, { error: 'Enter valid leave balances.' });
			}

			const { error: saveError } = await locals.supabase.rpc('update_leave_balances', {
				target,
				next_casual: casualLeave,
				next_earned: earnedLeave
			});

			if (saveError) {
				return fail(400, { error: 'Leave balances could not be saved.' });
			}

			setFlash(cookies, { type: 'success', message: 'Leave balances saved.' });
			const nextVertical = targetProfile.vertical_id ?? 'pending';
			redirect(303, `/admin/users/${nextVertical}/${target}`);
		}

		if (locals.profile.role !== 'admin') {
			return fail(403, { error: 'Not allowed.' });
		}

		const parsed = readProfileForm(formData);

		if ('error' in parsed) {
			return fail(400, { error: parsed.error });
		}

		const { error: saveError } = await locals.supabase.rpc('manage_profile', {
			target,
			next_status: parsed.status,
			next_role: parsed.role,
			next_vertical_id: parsed.verticalId,
			next_reports_to: parsed.reportsTo,
			next_designation: parsed.designation || null,
			next_casual: parsed.casualLeave,
			next_earned: parsed.earnedLeave,
			next_employee_id: parsed.employeeId
		});

		if (saveError) {
			const message =
				saveError.message?.includes('employee id taken') || saveError.code === '23505'
					? 'That employee ID is already assigned.'
					: 'Those details could not be saved.';
			return fail(400, { error: message });
		}

		setFlash(cookies, { type: 'success', message: 'Changes saved.' });
		const nextVertical = parsed.verticalId ?? 'pending';
		redirect(303, `/admin/users/${nextVertical}/${target}`);
	},

	delete: async ({ request, cookies, locals }) => {
		if (!locals.claims || !locals.profile || locals.profile.status !== 'approved') {
			return fail(401, { error: 'Sign in required.' });
		}

		if (locals.profile.role !== 'admin') {
			return fail(403, { error: 'Only admins can delete users.' });
		}

		const formData = await request.formData();
		const target = String(formData.get('id') ?? '');

		if (!target) {
			return fail(400, { error: 'Person not found.' });
		}

		if (target === locals.claims.sub) {
			return fail(400, { error: 'You cannot delete your own account.' });
		}

		const { data: targetProfile } = await locals.supabase
			.from('profiles')
			.select('email, vertical_id')
			.eq('id', target)
			.maybeSingle();

		if (!targetProfile || isPlatformAdminEmail(targetProfile.email)) {
			return fail(404, { error: 'Person not found' });
		}

		const { error: deleteError } = await locals.supabase.rpc('delete_user', { target });

		if (deleteError) {
			const message = deleteError.message?.includes('cannot delete self')
				? 'You cannot delete your own account.'
				: 'This person could not be deleted.';
			return fail(400, { error: message });
		}

		setFlash(cookies, {
			type: 'success',
			message: `${targetProfile.email} was deleted.`
		});
		const nextVertical = targetProfile.vertical_id ?? 'pending';
		redirect(303, `/admin/users/${nextVertical}`);
	}
} satisfies Actions;
