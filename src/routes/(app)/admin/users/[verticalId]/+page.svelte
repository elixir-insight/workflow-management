<script lang="ts">
	import { resolve } from '$app/paths';
	import { roleLabels } from '#lib/auth/roles';
	import { accessStatusLabels } from '#lib/auth/status';
	import { Card, CardDescription, CardHeader } from '#lib/components/ui/card';
	import StatusDot from '#lib/components/ui/status-dot.svelte';
	import { profileDisplayName } from '#lib/profile/display';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.vertical.name} · User management · ElixirPay</title>
</svelte:head>

<nav class="text-muted-foreground mb-4 text-sm">
	<a href={resolve('/(app)/admin/users')} class="text-foreground underline">User management</a>
	<span aria-hidden="true"> / </span>
	<span class="text-foreground">{data.vertical.name}</span>
</nav>

<p class="text-muted-foreground mb-6 text-sm">People mapped to this vertical.</p>

{#if data.loadError}
	<p role="alert" class="text-destructive text-sm">{data.loadError}</p>
{:else if data.users.length === 0}
	<Card>
		<CardHeader>
			<CardDescription>No one is in this vertical yet.</CardDescription>
		</CardHeader>
	</Card>
{:else}
	<ul class="flex flex-col gap-3">
		{#each data.users as person (person.id)}
			{@const name = profileDisplayName({
				first_name: person.first_name,
				last_name: person.last_name,
				email: person.email
			})}
			<li>
				<a
					href={resolve('/(app)/admin/users/[verticalId]/[userId]', {
						verticalId: data.vertical.id,
						userId: person.id
					})}
					class="border-border hover:bg-muted/50 flex items-center gap-3 rounded-xl border p-4 transition-colors"
				>
					<div class="min-w-0 flex-1">
						<p class="text-foreground truncate font-medium">{name}</p>
						<p class="text-muted-foreground flex flex-wrap items-center gap-x-1.5 text-sm">
							<span class="truncate">{person.email}</span>
							{#if person.employee_id}
								<span aria-hidden="true">·</span>
								<span>ID {person.employee_id}</span>
							{/if}
							<span aria-hidden="true">·</span>
							<span class="inline-flex items-center gap-1.5">
								<StatusDot status={person.status} />
								{accessStatusLabels[person.status]}
							</span>
							{#if person.role}
								<span aria-hidden="true">·</span>
								<span>{roleLabels[person.role]}</span>
							{/if}
							{#if person.designation}
								<span aria-hidden="true">·</span>
								<span>{person.designation}</span>
							{/if}
						</p>
					</div>
					<ChevronRight class="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
				</a>
			</li>
		{/each}
	</ul>
{/if}
