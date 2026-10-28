import { buildWfhEmail } from '#lib/attendance/email';
import { setFlash } from '#lib/server/flash';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.claims || !locals.profile || locals.profile.status !== 'approved') {
		error(401, 'Sign in required');
	}

	const userId = locals.claims.sub;
	const createdId = url.searchParams.get('created');

	const [{ data: me }, { data: requests }] = await Promise.all([
		locals.supabase
			.from('profiles')
			.select(
				'id, email, first_name, last_name, employee_id, designation, reports_to'
			)
			.eq('id', userId)
			.maybeSingle(),
		locals.supabase
			.from('wfh_requests')
			.select('id, work_date, reason, status, email_body, created_at, approver_id')
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
	]);

	if (!me) {
		error(500, 'Your profile could not be loaded.');
	}

	let manager: {
		id: string;
		email: string;
		first_name: string;
		last_name: string;
	} | null = null;

	if (me.reports_to) {
		const { data } = await locals.supabase
			.from('profiles')
			.select('id, email, first_name, last_name')
			.eq('id', me.reports_to)
			.maybeSingle();
		manager = data;
	}

	const created = createdId
		? ((requests ?? []).find((request) => request.id === createdId) ?? null)
		: null;

	return {
		me,
		manager,
		hasManager: Boolean(me.reports_to),
		requests: requests ?? [],
		created,
		mailTo: manager?.email?.trim() || '[reporting-lead@company.com]'
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

		const { data: me } = await locals.supabase
			.from('profiles')
			.select(
				'id, email, first_name, last_name, employee_id, designation, reports_to'
			)
			.eq('id', locals.claims.sub)
			.maybeSingle();

		if (!me) {
			return fail(400, { error: 'Your profile could not be loaded.', ...values });
		}

		let manager: {
			email: string;
			first_name: string;
			last_name: string;
		} | null = null;

		if (me.reports_to) {
			const { data } = await locals.supabase
				.from('profiles')
				.select('email, first_name, last_name')
				.eq('id', me.reports_to)
				.maybeSingle();
			manager = data;
		}

		const email = buildWfhEmail({
			applicant: me,
			manager,
			workDate,
			reason
		});

		const { data: requestId, error: applyError } = await locals.supabase.rpc('apply_wfh_request', {
			next_work_date: workDate,
			next_reason: reason,
			next_email_body: email.body
		});

		if (applyError || !requestId) {
			const raw = applyError?.message ?? '';
			const message =
				raw.includes('wfh already exists') || raw.includes('duplicate key')
					? 'You already have a WFH request for this date.'
					: 'The WFH request could not be submitted.';
			return fail(400, { error: message, ...values });
		}

		setFlash(cookies, {
			type: 'success',
			message: me.reports_to
				? 'WFH submitted. Copy the mail draft and send it to your reporting lead.'
				: 'WFH recorded. Copy the mail draft if you still want to notify someone.'
		});
		redirect(303, `/attendance/wfh?created=${requestId}`);
	}
} satisfies Actions;
