import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const pageSize = 50;

const categories = ['all', 'profile', 'leave', 'wfh', 'attendance', 'vertical'] as const;

export type LogCategory = (typeof categories)[number];

function isLogCategory(value: string | null): value is LogCategory {
	return !!value && (categories as readonly string[]).includes(value);
}

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.claims || !locals.profile || locals.profile.status !== 'approved') {
		error(401, 'Sign in required');
	}

	if (locals.profile.role !== 'admin') {
		error(403, 'Admins only');
	}

	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);
	const categoryParam = url.searchParams.get('category');
	const category: LogCategory = isLogCategory(categoryParam) ? categoryParam : 'all';
	const from = (page - 1) * pageSize;
	const to = from + pageSize - 1;

	let query = locals.supabase
		.from('audit_logs')
		.select(
			'id, actor_email, actor_id, action, entity_type, entity_id, entity_label, summary, changes, created_at',
			{ count: 'exact' }
		)
		.order('created_at', { ascending: false });

	if (category !== 'all') {
		query = query.like('action', `${category}.%`);
	}

	const { data, error: loadError, count } = await query.range(from, to);

	return {
		logs: data ?? [],
		page,
		pageSize,
		total: count ?? 0,
		category,
		loadError: loadError ? 'Activity logs could not be loaded.' : null
	};
};
