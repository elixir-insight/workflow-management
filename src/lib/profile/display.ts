export type ProfileNameFields = {
	first_name?: string | null;
	last_name?: string | null;
	email?: string | null;
};

export function profileDisplayName({ first_name, last_name, email }: ProfileNameFields) {
	const first = (first_name ?? '').trim();
	const last = (last_name ?? '').trim();
	const full = [first, last].filter(Boolean).join(' ');
	if (full) return full;

	const local = (email ?? '').split('@')[0]?.trim();
	return local || 'User';
}

export function profileInitials({ first_name, last_name, email }: ProfileNameFields) {
	const first = (first_name ?? '').trim();
	const last = (last_name ?? '').trim();

	if (first || last) {
		return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || first.charAt(0).toUpperCase();
	}

	const local = (email ?? '').split('@')[0] ?? '';
	const parts = local.split(/[._\s-]+/).filter(Boolean);

	if (parts.length >= 2) {
		return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
	}

	return (local.slice(0, 2) || '?').toUpperCase();
}

export function avatarPublicUrl(
	supabaseUrl: string,
	avatarPath: string | null | undefined
): string | null {
	if (!avatarPath) return null;
	const base = supabaseUrl.replace(/\/$/, '');
	return `${base}/storage/v1/object/public/avatars/${avatarPath}`;
}
