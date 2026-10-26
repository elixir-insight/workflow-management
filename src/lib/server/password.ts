/** Temporary password issued to every new account. Keep this equal to private.sync_password_reset. */
export const defaultPassword = 'Elixirpay@123';

export const workEmailDomain = '@elixirpay.in';

export function isWorkEmail(email: string) {
	return email.toLowerCase().endsWith(workEmailDomain);
}
