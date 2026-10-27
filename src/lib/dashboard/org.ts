import { platformAdminEmail } from '#lib/auth/platform-admin';
import type { AccessStatus, Database } from '#lib/supabase/database';
import type { SupabaseClient } from '@supabase/supabase-js';

type Client = SupabaseClient<Database>;

export type OrgPeopleCounts = {
	total: number;
	approved: number;
	pending: number;
	denied: number;
	unassigned: number;
};

export type OrgVerticalSummary = {
	id: string;
	name: string;
	total: number;
	pending: number;
	denied: number;
};

export type OrgDashboard = {
	today: string;
	people: OrgPeopleCounts;
	verticals: OrgVerticalSummary[];
	verticalCount: number;
	approvedHeadcount: number;
	todayPunches: number;
	loadError: string | null;
};

function todayIso() {
	return new Date().toISOString().slice(0, 10);
}

export async function loadOrgDashboard(supabase: Client): Promise<OrgDashboard> {
	const today = todayIso();

	const [
		{ data: verticals, error: verticalError },
		{ data: profiles, error: profileError },
		{ count: todayPunches, error: punchError }
	] = await Promise.all([
		supabase.from('verticals').select('id, name').order('name'),
		supabase
			.from('profiles')
			.select('id, status, vertical_id')
			.neq('email', platformAdminEmail),
		supabase
			.from('attendance_days')
			.select('id', { count: 'exact', head: true })
			.eq('work_date', today)
	]);

	const people: OrgPeopleCounts = {
		total: 0,
		approved: 0,
		pending: 0,
		denied: 0,
		unassigned: 0
	};

	const counts = new Map<string, { total: number; pending: number; denied: number }>();

	for (const profile of profiles ?? []) {
		people.total += 1;
		const status = profile.status as AccessStatus;
		if (status === 'approved') people.approved += 1;
		else if (status === 'pending') people.pending += 1;
		else if (status === 'denied') people.denied += 1;

		if (!profile.vertical_id) {
			people.unassigned += 1;
			continue;
		}

		const current = counts.get(profile.vertical_id) ?? { total: 0, pending: 0, denied: 0 };
		current.total += 1;
		if (status === 'pending') current.pending += 1;
		if (status === 'denied') current.denied += 1;
		counts.set(profile.vertical_id, current);
	}

	const verticalSummaries = (verticals ?? []).map((vertical) => ({
		...vertical,
		...(counts.get(vertical.id) ?? { total: 0, pending: 0, denied: 0 })
	}));

	return {
		today,
		people,
		verticals: verticalSummaries,
		verticalCount: verticalSummaries.length,
		approvedHeadcount: people.approved,
		todayPunches: todayPunches ?? 0,
		loadError:
			verticalError || profileError || punchError
				? 'Dashboard summary could not be fully loaded.'
				: null
	};
}
