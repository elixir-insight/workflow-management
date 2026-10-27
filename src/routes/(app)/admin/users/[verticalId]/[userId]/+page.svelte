<script lang="ts">
	import { resolve } from '$app/paths';
	import ProfileEditor from '#lib/components/admin/profile-editor.svelte';
	import { Card, CardContent, CardDescription, CardHeader } from '#lib/components/ui/card';
	import { profileDisplayName } from '#lib/profile/display';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

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

<Card>
	<CardHeader>
		<h2 class="text-foreground text-lg font-medium">{displayName}</h2>
		<CardDescription>
			{data.profile.email}
			{#if data.profile.employee_id}
				· Employee ID {data.profile.employee_id}
			{/if}
		</CardDescription>
		<CardDescription>Edit access, employee ID, vertical mapping, and leave balances.</CardDescription>
	</CardHeader>
	<CardContent>
		<ProfileEditor
			profile={data.profile}
			managers={managers}
			verticals={data.verticals}
			error={form?.error ?? null}
		/>
	</CardContent>
</Card>
