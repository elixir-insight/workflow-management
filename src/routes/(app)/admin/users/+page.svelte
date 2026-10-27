<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Button } from '#lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader } from '#lib/components/ui/card';
	import { Input } from '#lib/components/ui/input';
	import { Label } from '#lib/components/ui/label';
	import StatusDot from '#lib/components/ui/status-dot.svelte';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { toast } from 'svelte-sonner';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let creating = $state(false);
</script>

<svelte:head>
	<title>User management · ElixirPay</title>
</svelte:head>

<p class="text-muted-foreground mb-6 text-sm">Choose a vertical to manage its people.</p>

{#if data.loadError}
	<p role="alert" class="text-destructive mb-4 text-sm">{data.loadError}</p>
{/if}

<ul class="mb-8 flex flex-col gap-3">
	<li>
		<a
			href={resolve('/(app)/admin/users/[verticalId]', { verticalId: 'pending' })}
			class="border-border hover:bg-muted/50 flex items-center gap-3 rounded-xl border p-4 transition-colors"
		>
			<div class="min-w-0 flex-1">
				<p class="text-foreground font-medium">Unassigned</p>
				<p class="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
					<span>{data.unassigned.total} people</span>
					{#if data.unassigned.pending > 0}
						<span class="inline-flex items-center gap-1.5">
							<StatusDot status="amber" />
							{data.unassigned.pending} pending
						</span>
					{/if}
					{#if data.unassigned.denied > 0}
						<span class="inline-flex items-center gap-1.5">
							<StatusDot status="orange" />
							{data.unassigned.denied} denied
						</span>
					{/if}
				</p>
			</div>
			<ChevronRight class="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
		</a>
	</li>

	{#each data.verticals as vertical (vertical.id)}
		<li>
			<a
				href={resolve('/(app)/admin/users/[verticalId]', { verticalId: vertical.id })}
				class="border-border hover:bg-muted/50 flex items-center gap-3 rounded-xl border p-4 transition-colors"
			>
				<div class="min-w-0 flex-1">
					<p class="text-foreground font-medium">{vertical.name}</p>
					<p class="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
						<span>{vertical.total} people</span>
						{#if vertical.pending > 0}
							<span class="inline-flex items-center gap-1.5">
								<StatusDot status="amber" />
								{vertical.pending} pending
							</span>
						{/if}
						{#if vertical.denied > 0}
							<span class="inline-flex items-center gap-1.5">
								<StatusDot status="orange" />
								{vertical.denied} denied
							</span>
						{/if}
					</p>
				</div>
				<ChevronRight class="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
			</a>
		</li>
	{/each}
</ul>

{#if data.verticals.length === 0}
	<Card class="mb-8">
		<CardHeader>
			<CardDescription>No verticals yet. Add the first one below.</CardDescription>
		</CardHeader>
	</Card>
{/if}

<Card>
	<CardHeader>
		<h2 class="text-foreground text-lg font-medium">Add vertical</h2>
		<CardDescription>Product teams that people can be mapped to.</CardDescription>
	</CardHeader>
	<CardContent>
		<form
			method="POST"
			action="?/createVertical"
			class="flex flex-col gap-4"
			use:enhance={() => {
				creating = true;
				return async ({ result, update }) => {
					try {
						await update();
						if (result.type === 'failure' && typeof result.data?.error === 'string') {
							toast.error(result.data.error);
						}
					} finally {
						creating = false;
					}
				};
			}}
		>
			<div class="flex flex-col gap-2">
				<Label for="name">Name</Label>
				<Input
					id="name"
					name="name"
					required
					value={form?.name ?? ''}
					aria-invalid={form?.error ? true : undefined}
					class="h-11"
				/>
			</div>
			{#if form?.error}
				<p role="alert" class="text-destructive text-sm">{form.error}</p>
			{/if}
			<Button type="submit" class="h-11 w-full" disabled={creating}>
				{creating ? 'Saving…' : 'Add vertical'}
			</Button>
		</form>
	</CardContent>
</Card>
