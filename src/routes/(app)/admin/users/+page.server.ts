import { platformAdminEmail } from '#lib/auth/platform-admin';
import { setFlash } from '#lib/server/flash';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [{ data: verticals, error: verticalError }, { data: profiles, error: profileError }] =
		await Promise.all([
			locals.supabase.from('verticals').select('id, name, created_at').order('name'),
			locals.supabase
				.from('profiles')
				.select('id, email, vertical_id, status')
				.neq('email', platformAdminEmail)
		]);

	const counts = new Map<string, { total: number; pending: number; denied: number }>();

	for (const profile of profiles ?? []) {
		const key = profile.vertical_id ?? 'pending';
		const current = counts.get(key) ?? { total: 0, pending: 0, denied: 0 };
		current.total += 1;
		if (profile.status === 'pending') current.pending += 1;
		if (profile.status === 'denied') current.denied += 1;
		counts.set(key, current);
	}

	return {
		verticals: (verticals ?? []).map((vertical) => ({
			...vertical,
			...(counts.get(vertical.id) ?? { total: 0, pending: 0, denied: 0 })
		})),
		unassigned: counts.get('pending') ?? { total: 0, pending: 0, denied: 0 },
		loadError: verticalError || profileError ? 'Verticals could not be loaded.' : null
	};
};

export const actions = {
	createVertical: async ({ request, cookies, locals }) => {
		const formData = await request.formData();
		const name = String(formData.get('name') ?? '').trim();

		if (!name) {
			return fail(400, { error: 'Enter a vertical name.', name });
		}

		const { error } = await locals.supabase.from('verticals').insert({ name });

		if (error) {
			return fail(400, {
				error:
					error.code === '23505'
						? 'That vertical already exists.'
						: 'The vertical could not be created.',
				name
			});
		}

		setFlash(cookies, { type: 'success', message: `Vertical “${name}” added.` });
		return { created: name };
	}
} satisfies Actions;
