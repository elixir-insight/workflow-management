<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { roleLabels } from '#lib/auth/roles';
	import UserAvatar from '#lib/components/user-avatar.svelte';
	import * as Attachment from '#lib/components/ui/attachment/index.js';
	import { Button } from '#lib/components/ui/button';
	import { Input } from '#lib/components/ui/input';
	import { profileDisplayName } from '#lib/profile/display';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import ImageIcon from '@lucide/svelte/icons/image';
	import KeyRound from '@lucide/svelte/icons/key-round';
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

<div class="flex w-full flex-col gap-5 lg:gap-6">
	<p class="text-muted-foreground text-sm leading-relaxed">
		Update how you appear to your team, and keep your contact details current.
	</p>

	<!-- Identity header (Peerspace / Bevel / admin user pattern) -->
	<section
		class="border-border flex flex-col gap-4 rounded-2xl border p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8"
	>
		<div class="flex min-w-0 items-center gap-4">
			<UserAvatar
				firstName={data.profile.first_name}
				lastName={data.profile.last_name}
				email={data.profile.email}
				src={shownAvatar}
				size="lg"
				class="size-16 shrink-0 text-lg lg:size-18 lg:text-xl"
			/>
			<div class="min-w-0 flex-1">
				<h2 class="text-foreground truncate text-xl font-semibold tracking-tight lg:text-2xl">
					{displayName}
				</h2>
				<p class="text-muted-foreground mt-0.5 truncate text-sm">{data.profile.email}</p>
				<p class="text-muted-foreground mt-2 text-xs leading-relaxed lg:hidden">
					{#if data.profile.role}
						{roleLabels[data.profile.role]}
						<span aria-hidden="true"> · </span>
					{/if}
					{#if data.profile.employee_id}
						ID {data.profile.employee_id}
						<span aria-hidden="true"> · </span>
					{/if}
					{#if data.manager}
						Reports to {profileDisplayName(data.manager)}
					{:else}
						No reporting lead mapped
					{/if}
				</p>
			</div>
		</div>

		<div
			class="border-border hidden min-w-0 shrink-0 grid-cols-2 gap-x-8 gap-y-3 border-l pl-8 text-sm lg:grid"
		>
			<div>
				<p class="text-muted-foreground text-xs tracking-wide uppercase">Role</p>
				<p class="text-foreground mt-1 font-medium">
					{data.profile.role ? roleLabels[data.profile.role] : '—'}
				</p>
			</div>
			<div>
				<p class="text-muted-foreground text-xs tracking-wide uppercase">Employee ID</p>
				<p class="text-foreground mt-1 font-medium">
					{data.profile.employee_id || '—'}
				</p>
			</div>
			<div class="col-span-2">
				<p class="text-muted-foreground text-xs tracking-wide uppercase">Reports to</p>
				<p class="text-foreground mt-1 font-medium">
					{#if data.manager}
						{profileDisplayName(data.manager)}
						{#if data.manager.email}
							<span class="text-muted-foreground font-normal"> · {data.manager.email}</span>
						{/if}
					{:else}
						No reporting lead mapped
					{/if}
				</p>
			</div>
		</div>
	</section>

	<form
		method="POST"
		action="?/save"
		enctype="multipart/form-data"
		class="grid gap-5 lg:gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] xl:items-start"
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

		<section class="border-border flex flex-col gap-6 rounded-2xl border p-4 sm:p-5 lg:p-6">
			<!-- Photo (Sprig / Plain / Canva) -->
			<div class="flex flex-col gap-3">
				<div>
					<h3 class="text-foreground text-sm font-medium">Profile photo</h3>
					<p class="text-muted-foreground mt-0.5 text-xs leading-relaxed">
						JPG, PNG, WebP, or GIF · max 5 MB
					</p>
				</div>

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
							<Attachment.Description>Choose a photo to personalize your profile</Attachment.Description>
						</Attachment.Content>
						<Attachment.Trigger
							type="button"
							aria-label="Choose avatar file"
							onclick={openFilePicker}
						/>
					</Attachment.Root>
				{/if}

				<div class="flex flex-wrap gap-2">
					<Button type="button" variant="outline" class="h-10 rounded-xl" onclick={openFilePicker}>
						{attachment ? 'Replace photo' : 'Upload photo'}
					</Button>
					{#if attachment}
						<Button
							type="button"
							variant="ghost"
							class="text-muted-foreground h-10 rounded-xl"
							onclick={removeSelectedAvatar}
						>
							Remove
						</Button>
					{/if}
				</div>
			</div>

			<div class="border-border border-t"></div>

			<!-- Personal (Peerspace / Sprig) -->
			<div class="flex flex-col gap-4">
				<div>
					<h3 class="text-foreground text-sm font-medium">Personal details</h3>
					<p class="text-muted-foreground mt-0.5 text-xs leading-relaxed">
						Name and contact information visible to your team.
					</p>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="flex flex-col gap-1.5">
						<label
							for="firstName"
							class="text-muted-foreground text-xs font-medium tracking-wide uppercase"
						>
							First name
						</label>
						<Input
							id="firstName"
							name="firstName"
							value={data.profile.first_name}
							autocomplete="given-name"
							class="h-11 rounded-xl"
						/>
					</div>
					<div class="flex flex-col gap-1.5">
						<label
							for="lastName"
							class="text-muted-foreground text-xs font-medium tracking-wide uppercase"
						>
							Last name
						</label>
						<Input
							id="lastName"
							name="lastName"
							value={data.profile.last_name}
							autocomplete="family-name"
							class="h-11 rounded-xl"
						/>
					</div>
				</div>

				<div class="flex flex-col gap-1.5">
					<label
						for="phone"
						class="text-muted-foreground text-xs font-medium tracking-wide uppercase"
					>
						Phone number
					</label>
					<Input
						id="phone"
						name="phone"
						type="tel"
						value={data.profile.phone}
						autocomplete="tel"
						class="h-11 rounded-xl"
					/>
				</div>

				<div class="flex flex-col gap-1.5">
					<label
						for="presentAddress"
						class="text-muted-foreground text-xs font-medium tracking-wide uppercase"
					>
						Present address
					</label>
					<textarea
						id="presentAddress"
						name="presentAddress"
						rows="3"
						class="border-input bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-xl border px-3 py-2.5 text-base outline-none focus-visible:ring-3 md:text-sm"
					>{data.profile.present_address}</textarea>
				</div>
			</div>

			<div class="border-border border-t"></div>

			<!-- Work -->
			<div class="flex flex-col gap-4">
				<div>
					<h3 class="text-foreground text-sm font-medium">Work details</h3>
					<p class="text-muted-foreground mt-0.5 text-xs leading-relaxed">
						Identifiers used across attendance and timesheets.
					</p>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="flex flex-col gap-1.5">
						<label
							for="employeeId"
							class="text-muted-foreground text-xs font-medium tracking-wide uppercase"
						>
							Employee ID
						</label>
						<Input
							id="employeeId"
							name="employeeId"
							value={data.profile.employee_id ?? ''}
							placeholder="Optional"
							class="h-11 rounded-xl"
						/>
					</div>
					<div class="flex flex-col gap-1.5">
						<label
							for="designation"
							class="text-muted-foreground text-xs font-medium tracking-wide uppercase"
						>
							Designation
						</label>
						<Input
							id="designation"
							name="designation"
							value={data.profile.designation}
							placeholder="e.g. Engineer"
							class="h-11 rounded-xl"
						/>
					</div>
				</div>
			</div>

			{#if form?.error}
				<p role="alert" class="text-destructive text-sm">{form.error}</p>
			{/if}

			<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
				<Button type="submit" class="h-11 rounded-xl sm:min-w-40" disabled={saving}>
					{saving ? 'Saving…' : 'Save changes'}
				</Button>
				<p class="text-muted-foreground text-xs">
					Email and reporting lead are managed by an admin.
				</p>
			</div>
		</section>

		<!-- Security / account (Zalando / Headspace / Weather Channel) -->
		<aside class="flex flex-col gap-3">
			<div class="px-0.5">
				<h3 class="text-muted-foreground text-xs font-medium tracking-wide uppercase">Account</h3>
			</div>
			<div class="border-border overflow-hidden rounded-2xl border">
				<a
					href={resolve('/account/password')}
					class="hover:bg-muted/40 active:bg-muted/60 flex min-h-14 items-center gap-3 px-3.5 py-3.5 transition-colors"
				>
					<span
						class="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-xl"
						aria-hidden="true"
					>
						<KeyRound class="size-4" />
					</span>
					<span class="min-w-0 flex-1">
						<span class="text-foreground block text-sm font-medium">Change password</span>
						<span class="text-muted-foreground mt-0.5 block text-xs">
							Update the password for this account
						</span>
					</span>
					<ChevronRight class="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
				</a>
			</div>

			<div class="border-border bg-muted/20 rounded-2xl border px-3.5 py-3 text-xs leading-relaxed">
				<p class="text-muted-foreground">
					<span class="text-foreground font-medium">Email</span>
					<br />
					{data.profile.email}
				</p>
			</div>
		</aside>
	</form>
</div>
