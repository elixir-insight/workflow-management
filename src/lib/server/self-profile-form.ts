export type SelfProfileFormInput = {
	firstName: string;
	lastName: string;
	phone: string;
	presentAddress: string;
	removeAvatar: boolean;
};

export function readSelfProfileForm(formData: FormData): SelfProfileFormInput | { error: string } {
	const firstName = String(formData.get('firstName') ?? '').trim();
	const lastName = String(formData.get('lastName') ?? '').trim();
	const phone = String(formData.get('phone') ?? '').trim();
	const presentAddress = String(formData.get('presentAddress') ?? '').trim();
	const removeAvatar = formData.get('removeAvatar') === 'true';

	if (phone && !/^[\d+\-\s().]{7,20}$/.test(phone)) {
		return { error: 'Enter a valid phone number.' };
	}

	if (presentAddress.length > 500) {
		return { error: 'Address is too long.' };
	}

	return { firstName, lastName, phone, presentAddress, removeAvatar };
}

export function avatarExtension(file: File) {
	const fromType = file.type.split('/')[1];
	if (fromType === 'jpeg') return 'jpg';
	if (fromType === 'png' || fromType === 'webp' || fromType === 'gif' || fromType === 'jpg') {
		return fromType;
	}

	const nameExt = file.name.split('.').pop()?.toLowerCase();
	if (nameExt === 'jpeg') return 'jpg';
	if (nameExt === 'png' || nameExt === 'webp' || nameExt === 'gif' || nameExt === 'jpg') {
		return nameExt;
	}

	return null;
}
