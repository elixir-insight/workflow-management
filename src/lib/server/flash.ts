import type { Cookies } from '@sveltejs/kit';

export type FlashToast = {
	id: string;
	type: 'success' | 'error' | 'info' | 'warning';
	message: string;
};

const cookieName = 'ep_flash';

export function setFlash(
	cookies: Cookies,
	flash: Omit<FlashToast, 'id'> & { id?: string }
): void {
	const payload: FlashToast = {
		id: flash.id ?? crypto.randomUUID(),
		type: flash.type,
		message: flash.message
	};

	cookies.set(cookieName, JSON.stringify(payload), {
		path: '/',
		maxAge: 30,
		httpOnly: true,
		sameSite: 'lax',
		secure: false
	});
}

export function takeFlash(cookies: Cookies): FlashToast | null {
	const raw = cookies.get(cookieName);
	if (!raw) return null;

	cookies.delete(cookieName, { path: '/' });

	try {
		const parsed = JSON.parse(raw) as Partial<FlashToast>;
		if (
			typeof parsed.id !== 'string' ||
			typeof parsed.message !== 'string' ||
			(parsed.type !== 'success' &&
				parsed.type !== 'error' &&
				parsed.type !== 'info' &&
				parsed.type !== 'warning')
		) {
			return null;
		}

		return {
			id: parsed.id,
			type: parsed.type,
			message: parsed.message
		};
	} catch {
		return null;
	}
}
