import { setFlash } from '#lib/server/flash';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies, locals }) => {
	await locals.supabase.auth.signOut();
	setFlash(cookies, { type: 'success', message: 'Signed out successfully.' });
	redirect(303, '/');
};
