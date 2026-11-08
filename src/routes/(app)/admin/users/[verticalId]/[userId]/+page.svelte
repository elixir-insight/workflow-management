<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import ProfileEditor from '#lib/components/admin/profile-editor.svelte';
	import { Button } from '#lib/components/ui/button';
	import UserAvatar from '#lib/components/user-avatar.svelte';
	import { profileDisplayName } from '#lib/profile/display';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import { toast } from 'svelte-sonner';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let deleting = $state(false);

	const displayName = $derived(
		profileDisplayName({
			first_name: data.profile.first_name,
			last_name: data.profile.last_name,
			email: data.profile.email
		})
	);

	const managers = $derived(
		data.managers.map((manager) => ({
			id: manager.id,
			email: profileDisplayName({
				first_name: manager.first_name,
				last_name: manager.last_name,
				email: manager.email
			}),
			designation: manager.designation
		}))
	);
</script>

<svelte:head>
	<title>{displayName} · User management · ElixirPay</title>
</svelte:head>

<div class="flex w-full flex-col gap-6">
	<a
		href={resolve('/(app)/admin/users/[verticalId]', { verticalId: data.vertical.id })}
		class="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-sm transition-colors"
	>
		<ArrowLeft class="size-4" aria-hidden="true" />
		{data.vertical.name}
	</a>

	<section
		class="border-border flex flex-col gap-4 rounded-2xl border p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8"
	>
		<div class="flex min-w-0 items-center gap-4">
			<UserAvatar
				firstName={data.profile.first_name}
				lastName={data.profile.last_name}
				email={data.profile.email}
				size="lg"
				class="size-16 shrink-0 text-lg lg:size-18 lg:text-xl"
			/>
			<div class="min-w-0 flex-1">
				<h2 class="text-foreground truncate text-xl font-semibold tracking-tight lg:text-2xl">
					{displayName}
				</h2>
				<p class="text-muted-foreground mt-0.5 truncate text-sm">{data.profile.email}</p>
				<p class="text-muted-foreground mt-2 text-xs leading-relaxed lg:hidden">
					{#if data.profile.employee_id}
						ID {data.profile.employee_id}
						<span aria-hidden="true"> · </span>
					{/if}
					{#if data.reportingLead}
						Reports to {profileDisplayName(data.reportingLead)}
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
				<p class="text-muted-foreground text-xs tracking-wide uppercase">Employee ID</p>
				<p class="text-foreground mt-1 font-medium">
					{data.profile.employee_id || '—'}
				</p>
			</div>
			<div>
				<p class="text-muted-foreground text-xs tracking-wide uppercase">Reports to</p>
				<p class="text-foreground mt-1 max-w-48 truncate font-medium">
					{#if data.reportingLead}
						{profileDisplayName(data.reportingLead)}
					{:else}
						No reporting lead
					{/if}
				</p>
			</div>
			<div class="col-span-2">
				<p class="text-muted-foreground text-xs leading-relaxed">
					{#if data.canEditAll}
						Edit personal details, access, reporting, timesheet exemption, and leave balances.
					{:else}
						View all details. You can edit leave balances only.
					{/if}
				</p>
			</div>
		</div>

		<p class="text-muted-foreground text-xs leading-relaxed lg:hidden">
			{#if data.canEditAll}
				Edit personal details, access, reporting, timesheet exemption, and leave balances.
			{:else}
				View all details. You can edit leave balances only.
			{/if}
		</p>
	</section>

	<div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start">
		<section class="border-border rounded-2xl border p-4 sm:p-5 lg:p-6">
			<ProfileEditor
				profile={data.profile}
				managers={managers}
				verticals={data.verticals}
				error={form?.error ?? null}
				canEditAll={data.canEditAll}
			/>
		</section>

		{#if data.canDelete}
			<section class="border-destructive/20 bg-destructive/5 rounded-2xl border p-4 sm:p-5 xl:sticky xl:top-24">
				<h2 class="text-foreground text-base font-medium">Delete user</h2>
				<p class="text-muted-foreground mt-1 text-sm leading-relaxed">
					Permanently removes this account and their attendance data. This cannot be undone.
				</p>
				<form
					method="POST"
					action="?/delete"
					class="mt-4"
					use:enhance={({ cancel }) => {
						const confirmed = confirm(`Delete ${data.profile.email}? This cannot be undone.`);
						if (!confirmed) {
							cancel();
							return;
						}

						deleting = true;
						return async ({ result, update }) => {
							try {
								await update();
								if (result.type === 'failure' && typeof result.data?.error === 'string') {
									toast.error(result.data.error);
								}
							} finally {
								deleting = false;
							}
						};
					}}
				>
					<input type="hidden" name="id" value={data.profile.id} />
					<Button
						type="submit"
						variant="destructive"
						class="h-11 w-full rounded-xl"
						disabled={deleting}
					>
						{deleting ? 'Deleting…' : 'Delete user'}
					</Button>
				</form>
			</section>
		{/if}
	</div>
</div>
