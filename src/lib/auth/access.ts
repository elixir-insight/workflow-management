export const workEmailDomains = ['@elixirpay.in', '@elixirglobal.com'] as const;

export const accessContact = 'Ali.Afroze@elixirglobal.com';

export function isWorkEmail(email: string) {
	const normalized = email.toLowerCase();
	return workEmailDomains.some((domain) => normalized.endsWith(domain));
}
