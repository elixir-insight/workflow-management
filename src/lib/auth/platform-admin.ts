export const platformAdminEmail = 'admin@elixirpay.in';

export function isPlatformAdminEmail(email: string | null | undefined) {
	return (email ?? '').toLowerCase() === platformAdminEmail;
}
