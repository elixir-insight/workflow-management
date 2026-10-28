<script lang="ts">
	import { enhance } from '$app/forms';
	import { roleLabels } from '#lib/auth/roles';
	import UserAvatar from '#lib/components/user-avatar.svelte';
	import * as Attachment from '#lib/components/ui/attachment/index.js';
	import { Button } from '#lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader } from '#lib/components/ui/card';
	import { Input } from '#lib/components/ui/input';
	import { Label } from '#lib/components/ui/label';
	import { profileDisplayName } from '#lib/profile/display';
	import ImageIcon from '@lucide/svelte/icons/image';
	import UploadIcon from '@lucide/svelte/icons/upload';
	import XIcon from '@lucide/svelte/icons/x';
	import { toast } from 'svelte-sonner';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let saving = $state(false);
	let removeAvatar = $state(false);
	let previewUrl = $state<string | null>(null);
	let selectedFile = $state<File | null>(null);
	let fileInput = $state<HTMLInputElement | null>(null);

	const displayName = $derived(
		profileDisplayName({
			first_name: data.profile.first_name,
			last_name: data.profile.last_name,
			email: data.profile.email
		})
	);

	const shownAvatar = $derived(removeAvatar ? null : (previewUrl ?? data.profile.avatarUrl));

	const existingName = $derived(data.profile.avatar_path?.split('/').pop() ?? 'avatar');

	const attachment = $derived.by(() => {
		if (selectedFile) {
			return {
				state: 'idle' as const,
				name: selectedFile.name,
				description: `${fileLabel(selectedFile.type)} · ${formatBytes(selectedFile.size)}`,
				src: previewUrl
			};
		}

		if (!removeAvatar && data.profile.avatarUrl) {
			return {
				state: 'done' as const,
				name: existingName,
				description: 'Current avatar',
				src: data.profile.avatarUrl
			};
		}

		return null;
	});

	function fileLabel(type: string) {
		if (type === 'image/jpeg') return 'JPG';
		if (type === 'image/png') return 'PNG';
		if (type === 'image/webp') return 'WebP';
		if (type === 'image/gif') return 'GIF';
		return 'Image';
	}

	function formatBytes(bytes: number) {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	function clearPreview() {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		previewUrl = null;
		selectedFile = null;
	}

	function onAvatarChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0] ?? null;
		clearPreview();
		selectedFile = file;
		previewUrl = file ? URL.createObjectURL(file) : null;
		removeAvatar = false;
	}

	function removeSelectedAvatar() {
		removeAvatar = true;
		clearPreview();
		if (fileInput) fileInput.value = '';
	}

	function openFilePicker() {
		fileInput?.click();
	}
</script>

<svelte:head>
	<title>Profile · ElixirPay</title>
</svelte:head>

<div class="mx-auto w-full max-w-lg">
	<Card>
		<CardHeader class="items-center text-center">
			<UserAvatar
				firstName={data.profile.first_name}
				lastName={data.profile.last_name}
				email={data.profile.email}
				src={shownAvatar}
				size="lg"
				class="mx-auto"
			/>
			<h2 class="text-foreground text-lg font-medium">{displayName}</h2>
			<CardDescription>
				{data.profile.email}
				{#if data.profile.role}
					· {roleLabels[data.profile.role]}
				{/if}
				{#if data.profile.employee_id}
					· ID {data.profile.employee_id}
				{/if}
			</CardDescription>
		</CardHeader>
		<CardContent>
			<form
				method="POST"
				action="?/save"
				enctype="multipart/form-data"
				class="flex flex-col gap-5"
				use:enhance={() => {
					saving = true;
					return async ({ result, update }) => {
						try {
							await update();
							if (result.type === 'failure' && typeof result.data?.error === 'string') {
								toast.error(result.data.error);
							} else if (result.type === 'success' || result.type === 'redirect') {
								clearPreview();
								removeAvatar = false;
								if (fileInput) fileInput.value = '';
							}
						} finally {
							saving = false;
						}
					};
				}}
			>
				<input type="hidden" name="removeAvatar" value={removeAvatar ? 'true' : 'false'} />

				<div class="flex flex-col gap-3">
					<Label for="avatar">Avatar</Label>

					<input
						bind:this={fileInput}
						id="avatar"
						name="avatar"
						type="file"
						accept="image/jpeg,image/png,image/webp,image/gif"
						class="sr-only"
						onchange={onAvatarChange}
					/>

					{#if attachment}
						<Attachment.Root
							state={saving && selectedFile ? 'uploading' : attachment.state}
							class="w-full"
						>
							{#if attachment.src}
								<Attachment.Media variant="image">
									<img src={attachment.src} alt="" />
								</Attachment.Media>
							{:else}
								<Attachment.Media>
									<ImageIcon />
								</Attachment.Media>
							{/if}
							<Attachment.Content>
								<Attachment.Title>{attachment.name}</Attachment.Title>
								<Attachment.Description>
									{saving && selectedFile ? 'Uploading…' : attachment.description}
								</Attachment.Description>
							</Attachment.Content>
							<Attachment.Actions>
								<Attachment.Action
									type="button"
									aria-label="Remove {attachment.name}"
									onclick={removeSelectedAvatar}
								>
									<XIcon />
								</Attachment.Action>
							</Attachment.Actions>
						</Attachment.Root>
					{:else}
						<Attachment.Root state="idle" class="w-full">
							<Attachment.Media>
								<UploadIcon />
							</Attachment.Media>
							<Attachment.Content>
								<Attachment.Title>No avatar selected</Attachment.Title>
								<Attachment.Description>JPG, PNG, WebP, or GIF · max 5 MB</Attachment.Description>
							</Attachment.Content>
							<Attachment.Trigger
								type="button"
								aria-label="Choose avatar file"
								onclick={openFilePicker}
							/>
						</Attachment.Root>
					{/if}

					<Button type="button" variant="outline" class="h-10" onclick={openFilePicker}>
						{attachment ? 'Replace avatar' : 'Choose avatar'}
					</Button>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="flex flex-col gap-2">
						<Label for="firstName">First name</Label>
						<Input
							id="firstName"
							name="firstName"
							value={data.profile.first_name}
							autocomplete="given-name"
							class="h-11"
						/>
					</div>
					<div class="flex flex-col gap-2">
						<Label for="lastName">Last name</Label>
						<Input
							id="lastName"
							name="lastName"
							value={data.profile.last_name}
							autocomplete="family-name"
							class="h-11"
						/>
					</div>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="flex flex-col gap-2">
						<Label for="employeeId">Employee ID</Label>
						<Input
							id="employeeId"
							name="employeeId"
							value={data.profile.employee_id ?? ''}
							placeholder="Optional"
							class="h-11"
						/>
					</div>
					<div class="flex flex-col gap-2">
						<Label for="designation">Designation</Label>
						<Input
							id="designation"
							name="designation"
							value={data.profile.designation}
							placeholder="e.g. Engineer"
							class="h-11"
						/>
					</div>
				</div>

				<div class="flex flex-col gap-2">
					<Label for="phone">Phone number</Label>
					<Input
						id="phone"
						name="phone"
						type="tel"
						value={data.profile.phone}
						autocomplete="tel"
						class="h-11"
					/>
				</div>

				<div class="flex flex-col gap-2">
					<Label for="presentAddress">Present address</Label>
					<textarea
						id="presentAddress"
						name="presentAddress"
						rows="3"
						class="border-input bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border px-2.5 py-2 text-base outline-none focus-visible:ring-3 md:text-sm"
					>{data.profile.present_address}</textarea>
				</div>

				{#if form?.error}
					<p role="alert" class="text-destructive text-sm">{form.error}</p>
				{/if}

				<Button type="submit" class="h-11 w-full" disabled={saving}>
					{saving ? 'Saving…' : 'Save profile'}
				</Button>
			</form>
		</CardContent>
	</Card>
</div>
