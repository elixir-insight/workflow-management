<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import ProfileEditor from '#lib/components/admin/profile-editor.svelte';
	import { Button } from '#lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader } from '#lib/components/ui/card';
	import { profileDisplayName } from '#lib/profile/display';
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

<nav class="text-muted-foreground mb-4 text-sm">
	<a href={resolve('/(app)/admin/users')} class="text-foreground underline">User management</a>
	<span aria-hidden="true"> / </span>
	<a
		href={resolve('/(app)/admin/users/[verticalId]', { verticalId: data.vertical.id })}
		class="text-foreground underline"
	>
		{data.vertical.name}
	</a>
	<span aria-hidden="true"> / </span>
	<span class="text-foreground">Details</span>
</nav>

<div class="flex flex-col gap-6">
	<Card>
		<CardHeader>
			<h2 class="text-foreground text-lg font-medium">{displayName}</h2>
			<CardDescription>
				{data.profile.email}
				{#if data.profile.employee_id}
					· Employee ID {data.profile.employee_id}
				{/if}
			</CardDescription>
			<CardDescription>
				{#if data.canEditAll}
					Edit access, employee ID, vertical mapping, and leave balances.
				{:else}
					View all details. You can edit leave balances only.
				{/if}
			</CardDescription>
		</CardHeader>
		<CardContent>
			<ProfileEditor
				profile={data.profile}
				managers={managers}
				verticals={data.verticals}
				error={form?.error ?? null}
				canEditAll={data.canEditAll}
			/>
		</CardContent>
	</Card>

	{#if data.canDelete}
		<Card>
			<CardHeader>
				<h2 class="text-foreground text-lg font-medium">Delete user</h2>
				<CardDescription>
					Permanently removes this account and their attendance data. This cannot be undone.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					method="POST"
					action="?/delete"
					class="flex flex-col gap-3"
					use:enhance={({ cancel }) => {
						const confirmed = confirm(
							`Delete ${data.profile.email}? This cannot be undone.`
						);
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
					<Button type="submit" variant="destructive" class="h-11 w-full" disabled={deleting}>
						{deleting ? 'Deleting…' : 'Delete user'}
					</Button>
				</form>
			</CardContent>
		</Card>
	{/if}
</div>
