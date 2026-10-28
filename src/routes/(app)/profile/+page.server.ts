import { SUPABASE_URL } from '$app/env/private';
import { avatarPublicUrl } from '#lib/profile/display';
import { setFlash } from '#lib/server/flash';
import { avatarExtension, readSelfProfileForm } from '#lib/server/self-profile-form';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const maxAvatarBytes = 5 * 1024 * 1024;
const allowedAvatarTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.claims || !locals.profile || locals.profile.status !== 'approved') {
		error(401, 'Sign in required');
	}

	const { data: profile, error: profileError } = await locals.supabase
		.from('profiles')
		.select(
			'id, email, first_name, last_name, phone, present_address, avatar_path, employee_id, designation, role'
		)
		.eq('id', locals.claims.sub)
		.maybeSingle();

	if (profileError || !profile) {
		error(500, 'Your profile could not be loaded.');
	}

	return {
		profile: {
			...profile,
			avatarUrl: avatarPublicUrl(SUPABASE_URL, profile.avatar_path)
		}
	};
};

export const actions = {
	save: async ({ request, cookies, locals }) => {
		if (!locals.claims || !locals.profile || locals.profile.status !== 'approved') {
			return fail(401, { error: 'Sign in required.' });
		}

		const userId = locals.claims.sub;
		const formData = await request.formData();
		const parsed = readSelfProfileForm(formData);

		if ('error' in parsed) {
			return fail(400, { error: parsed.error });
		}

		const { data: current, error: currentError } = await locals.supabase
			.from('profiles')
			.select('avatar_path')
			.eq('id', userId)
			.maybeSingle();

		if (currentError || !current) {
			return fail(400, { error: 'Your profile could not be updated.' });
		}

		const avatarFile = formData.get('avatar');
		let nextAvatarPath: string | null | undefined = undefined;

		if (parsed.removeAvatar) {
			if (current.avatar_path) {
				await locals.supabase.storage.from('avatars').remove([current.avatar_path]);
			}
			nextAvatarPath = '';
		} else if (avatarFile instanceof File && avatarFile.size > 0) {
			if (!allowedAvatarTypes.has(avatarFile.type)) {
				return fail(400, { error: 'Use a JPG, PNG, WebP, or GIF image.' });
			}

			if (avatarFile.size > maxAvatarBytes) {
				return fail(400, { error: 'Avatar must be 5 MB or smaller.' });
			}

			const extension = avatarExtension(avatarFile);
			if (!extension) {
				return fail(400, { error: 'Use a JPG, PNG, WebP, or GIF image.' });
			}

			// Unique path so browsers/CDN don't keep showing the previous photo.
			const path = `${userId}/avatar-${Date.now()}.${extension}`;
			const { error: uploadError } = await locals.supabase.storage
				.from('avatars')
				.upload(path, avatarFile, {
					upsert: false,
					contentType: avatarFile.type,
					cacheControl: '3600'
				});

			if (uploadError) {
				return fail(400, { error: 'Avatar could not be uploaded.' });
			}

			if (current.avatar_path) {
				await locals.supabase.storage.from('avatars').remove([current.avatar_path]);
			}

			nextAvatarPath = path;
		}

		const { error: saveError } = await locals.supabase.rpc('update_my_profile', {
			next_first_name: parsed.firstName,
			next_last_name: parsed.lastName,
			next_phone: parsed.phone,
			next_present_address: parsed.presentAddress,
			next_avatar_path: nextAvatarPath,
			next_employee_id: parsed.employeeId ?? '',
			next_designation: parsed.designation
		});

		if (saveError) {
			const message = saveError.message?.includes('employee id already in use')
				? 'That employee ID is already used by someone else.'
				: 'Those details could not be saved.';
			return fail(400, { error: message });
		}

		setFlash(cookies, { type: 'success', message: 'Profile updated.' });
		redirect(303, '/profile');
	}
} satisfies Actions;
