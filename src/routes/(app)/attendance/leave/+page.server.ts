import { buildLeaveEmail, inclusiveDayCount } from '#lib/attendance/email';
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
				'id, email, first_name, last_name, employee_id, designation, reports_to, casual_leave, earned_leave'
			)
			.eq('id', userId)
			.maybeSingle(),
		locals.supabase
			.from('leave_requests')
			.select(
				'id, leave_kind, start_date, end_date, day_count, reason, status, email_body, approver_id, created_at'
			)
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
		requests: requests ?? [],
		created
	};
};

export const actions = {
	apply: async ({ request, cookies, locals }) => {
		const formData = await request.formData();
		const leaveKind = String(formData.get('leaveKind') ?? '');
		const startDate = String(formData.get('startDate') ?? '').trim();
		const endDate = String(formData.get('endDate') ?? '').trim();
		const reason = String(formData.get('reason') ?? '').trim();
		const values = { leaveKind, startDate, endDate, reason };

		if (!locals.claims || !locals.profile || locals.profile.status !== 'approved') {
			return fail(401, { error: 'Sign in required.', ...values });
		}

		if (leaveKind !== 'casual' && leaveKind !== 'earned') {
			return fail(400, { error: 'Choose casual or earned leave.', ...values });
		}

		if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
			return fail(400, { error: 'Enter valid leave dates.', ...values });
		}

		const dayCount = inclusiveDayCount(startDate, endDate);
		if (dayCount === null) {
			return fail(400, {
				error: 'End date must be on or after the start date.',
				...values
			});
		}

		if (!reason) {
			return fail(400, { error: 'Add a short reason for the leave.', ...values });
		}

		const { data: me } = await locals.supabase
			.from('profiles')
			.select(
				'id, email, first_name, last_name, employee_id, designation, reports_to, casual_leave, earned_leave'
			)
			.eq('id', locals.claims.sub)
			.maybeSingle();

		if (!me) {
			return fail(400, { error: 'Your profile could not be loaded.', ...values });
		}

		const balance = leaveKind === 'casual' ? me.casual_leave : me.earned_leave;
		if (balance < dayCount) {
			return fail(400, {
				error: `Not enough ${leaveKind} leave. Available: ${balance}.`,
				...values
			});
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

		const email = buildLeaveEmail({
			applicant: me,
			manager,
			leaveKind,
			startDate,
			endDate,
			dayCount,
			reason
		});

		const { data: requestId, error: applyError } = await locals.supabase.rpc('apply_leave_request', {
			next_leave_kind: leaveKind,
			next_start_date: startDate,
			next_end_date: endDate,
			next_day_count: dayCount,
			next_reason: reason,
			next_email_body: email.body
		});

		if (applyError || !requestId) {
			return fail(400, {
				error: applyError?.message?.includes('insufficient')
					? 'Not enough leave balance for this request.'
					: 'The leave request could not be submitted.',
				...values
			});
		}

		setFlash(cookies, {
			type: 'success',
			message: manager
				? 'Leave submitted. Copy the mail draft and send it to your reporting lead.'
				: 'Leave captured immediately — no reporting lead is mapped.'
		});
		redirect(303, `/attendance/leave?created=${requestId}`);
	}
} satisfies Actions;
