import { setFlash } from '#lib/server/flash';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.claims || !locals.profile || locals.profile.status !== 'approved') {
		error(401, 'Sign in required');
	}

	const [{ data: me }, { data: requests }] = await Promise.all([
		locals.supabase
			.from('profiles')
			.select('reports_to')
			.eq('id', locals.claims.sub)
			.maybeSingle(),
		locals.supabase
			.from('wfh_requests')
			.select('id, work_date, reason, status, created_at, approver_id')
			.eq('user_id', locals.claims.sub)
			.order('created_at', { ascending: false })
	]);

	let managerEmail: string | null = null;
	if (me?.reports_to) {
		const { data: manager } = await locals.supabase
			.from('profiles')
			.select('email, first_name, last_name')
			.eq('id', me.reports_to)
			.maybeSingle();
		managerEmail = manager?.email ?? null;
	}

	return {
		hasManager: Boolean(me?.reports_to),
		managerEmail,
		requests: requests ?? []
	};
};

export const actions = {
	apply: async ({ request, cookies, locals }) => {
		const formData = await request.formData();
		const workDate = String(formData.get('workDate') ?? '').trim();
		const reason = String(formData.get('reason') ?? '').trim();
		const values = { workDate, reason };

		if (!locals.claims || !locals.profile || locals.profile.status !== 'approved') {
			return fail(401, { error: 'Sign in required.', ...values });
		}

		if (!/^\d{4}-\d{2}-\d{2}$/.test(workDate)) {
			return fail(400, { error: 'Choose a valid WFH date.', ...values });
		}

		if (!reason) {
			return fail(400, { error: 'Add a short reason for WFH.', ...values });
		}

		const { error: applyError } = await locals.supabase.rpc('apply_wfh_request', {
			next_work_date: workDate,
			next_reason: reason
		});

		if (applyError) {
			return fail(400, {
				error: 'The WFH request could not be submitted.',
				...values
			});
		}

		const { data: me } = await locals.supabase
			.from('profiles')
			.select('reports_to')
			.eq('id', locals.claims.sub)
			.maybeSingle();

		setFlash(cookies, {
			type: 'success',
			message: me?.reports_to
				? 'WFH request submitted for approval.'
				: 'WFH captured immediately — no reporting lead is mapped.'
		});
		redirect(303, '/attendance/wfh');
	}
} satisfies Actions;
