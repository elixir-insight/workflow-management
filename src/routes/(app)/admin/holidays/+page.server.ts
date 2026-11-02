import { setFlash } from '#lib/server/flash';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.claims || !locals.profile || locals.profile.status !== 'approved') {
		error(401, 'Sign in required');
	}

	if (locals.profile.role !== 'admin') {
		error(403, 'Only admins can manage office holidays.');
	}

	const { data: holidays, error: holidaysError } = await locals.supabase
		.from('office_holidays')
		.select('id, holiday_date, name, created_at')
		.order('holiday_date', { ascending: false });

	if (holidaysError) {
		error(500, 'Office holidays could not be loaded.');
	}

	return {
		holidays: holidays ?? []
	};
};

export const actions = {
	add: async ({ request, cookies, locals }) => {
		const formData = await request.formData();
		const holidayDate = String(formData.get('holidayDate') ?? '').trim();
		const name = String(formData.get('name') ?? '').trim();
		const values = { holidayDate, name };

		if (!locals.claims || !locals.profile || locals.profile.status !== 'approved') {
			return fail(401, { error: 'Sign in required.', ...values });
		}

		if (locals.profile.role !== 'admin') {
			return fail(403, { error: 'Only admins can add office holidays.', ...values });
		}

		if (!/^\d{4}-\d{2}-\d{2}$/.test(holidayDate)) {
			return fail(400, { error: 'Choose a valid holiday date.', ...values });
		}

		if (name.length > 120) {
			return fail(400, { error: 'Holiday name is too long.', ...values });
		}

		const { error: insertError } = await locals.supabase.from('office_holidays').insert({
			holiday_date: holidayDate,
			name,
			created_by: locals.claims.sub
		});

		if (insertError) {
			const message = insertError.message?.includes('duplicate')
				? 'That date is already marked as an office holiday.'
				: 'The holiday could not be saved.';
			return fail(400, { error: message, ...values });
		}

		setFlash(cookies, {
			type: 'success',
			message: 'Office holiday added.'
		});
		redirect(303, '/admin/holidays');
	},

	remove: async ({ request, cookies, locals }) => {
		const empty = { holidayDate: '', name: '' };

		if (!locals.claims || !locals.profile || locals.profile.status !== 'approved') {
			return fail(401, { error: 'Sign in required.', ...empty });
		}

		if (locals.profile.role !== 'admin') {
			return fail(403, { error: 'Only admins can remove office holidays.', ...empty });
		}

		const formData = await request.formData();
		const id = String(formData.get('id') ?? '').trim();

		if (!id) {
			return fail(400, { error: 'Choose a holiday to remove.', ...empty });
		}

		const { error: deleteError } = await locals.supabase
			.from('office_holidays')
			.delete()
			.eq('id', id);

		if (deleteError) {
			return fail(400, { error: 'The holiday could not be removed.', ...empty });
		}

		setFlash(cookies, {
			type: 'success',
			message: 'Office holiday removed.'
		});
		redirect(303, '/admin/holidays');
	}
} satisfies Actions;
