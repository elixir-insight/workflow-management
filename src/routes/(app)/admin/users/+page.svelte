<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Button } from '#lib/components/ui/button';
	import { Input } from '#lib/components/ui/input';
	import { Label } from '#lib/components/ui/label';
	import StatusDot from '#lib/components/ui/status-dot.svelte';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Plus from '@lucide/svelte/icons/plus';
	import Search from '@lucide/svelte/icons/search';
	import Users from '@lucide/svelte/icons/users';
	import { toast } from 'svelte-sonner';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let creating = $state(false);
	let query = $state('');

	const normalizedQuery = $derived(query.trim().toLowerCase());

	const filteredVerticals = $derived(
		data.verticals.filter((vertical) =>
			normalizedQuery ? vertical.name.toLowerCase().includes(normalizedQuery) : true
		)
	);

	const showUnassigned = $derived(
		!normalizedQuery || 'unassigned'.includes(normalizedQuery)
	);

	const teamCount = $derived((showUnassigned ? 1 : 0) + filteredVerticals.length);
</script>

<svelte:head>
	<title>User management · ElixirPay</title>
</svelte:head>

<div class="flex w-full flex-col gap-6">
	<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
		<div class="flex min-w-0 flex-col gap-1">
			<p class="text-muted-foreground text-sm leading-relaxed">
				Choose a vertical to manage its people.
			</p>
		</div>

		<label class="relative block w-full lg:max-w-sm">
			<span class="sr-only">Search verticals</span>
			<Search
				class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
				aria-hidden="true"
			/>
			<Input
				type="search"
				bind:value={query}
				placeholder="Search verticals"
				class="bg-muted/40 h-11 rounded-xl border-transparent pr-3 pl-10 shadow-none"
			/>
		</label>
	</div>

	{#if data.loadError}
		<p role="alert" class="text-destructive text-sm">{data.loadError}</p>
	{/if}

	<section class="flex flex-col gap-3">
		<div class="flex items-baseline justify-between gap-3 px-0.5">
			<h2 class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
				Verticals
			</h2>
			<p class="text-muted-foreground text-xs">{teamCount}</p>
		</div>

		{#if !showUnassigned && filteredVerticals.length === 0}
			<div
				class="border-border bg-muted/20 text-muted-foreground rounded-2xl border border-dashed px-4 py-10 text-center text-sm"
			>
				No verticals match “{query.trim()}”.
			</div>
		{:else}
			<div class="border-border overflow-hidden rounded-2xl border">
				<div
					class="text-muted-foreground border-border bg-muted/30 hidden grid-cols-[minmax(0,1fr)_8rem_minmax(0,14rem)_1.25rem] gap-4 border-b px-4 py-2.5 text-xs font-medium tracking-wide uppercase lg:grid"
					aria-hidden="true"
				>
					<span>Vertical</span>
					<span>People</span>
					<span>Attention</span>
					<span></span>
				</div>

				<ul class="divide-border divide-y">
					{#if showUnassigned}
						<li>
							<a
								href={resolve('/(app)/admin/users/[verticalId]', { verticalId: 'pending' })}
								class="hover:bg-muted/40 active:bg-muted/60 flex min-h-16 items-center gap-3 px-3.5 py-3.5 transition-colors lg:grid lg:grid-cols-[minmax(0,1fr)_8rem_minmax(0,14rem)_1.25rem] lg:gap-4 lg:px-4 lg:py-3"
							>
								<span class="flex min-w-0 flex-1 items-center gap-3 lg:flex-none">
									<span
										class="bg-muted text-muted-foreground flex size-11 shrink-0 items-center justify-center rounded-xl lg:size-10"
										aria-hidden="true"
									>
										<Users class="size-5" />
									</span>
									<span class="min-w-0">
										<span class="text-foreground block truncate font-medium">Unassigned</span>
										<span class="text-muted-foreground mt-0.5 block text-sm lg:hidden">
											{data.unassigned.total} people
										</span>
										<span class="mt-2 flex flex-wrap gap-2 lg:hidden">
											{#if data.unassigned.pending > 0}
												<span
													class="bg-amber/15 text-amber inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
												>
													<StatusDot status="amber" />
													{data.unassigned.pending} pending
												</span>
											{/if}
											{#if data.unassigned.denied > 0}
												<span
													class="bg-orange/15 text-orange inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
												>
													<StatusDot status="orange" />
													{data.unassigned.denied} denied
												</span>
											{/if}
										</span>
									</span>
								</span>

								<span class="text-foreground hidden text-sm font-medium lg:block">
									{data.unassigned.total}
								</span>

								<span class="hidden flex-wrap items-center gap-2 lg:flex">
									{#if data.unassigned.pending > 0}
										<span
											class="bg-amber/15 text-amber inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
										>
											<StatusDot status="amber" />
											{data.unassigned.pending} pending
										</span>
									{/if}
									{#if data.unassigned.denied > 0}
										<span
											class="bg-orange/15 text-orange inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
										>
											<StatusDot status="orange" />
											{data.unassigned.denied} denied
										</span>
									{/if}
									{#if data.unassigned.pending === 0 && data.unassigned.denied === 0}
										<span class="text-muted-foreground text-sm">—</span>
									{/if}
								</span>

								<ChevronRight
									class="text-muted-foreground ml-auto size-4 shrink-0 lg:ml-0"
									aria-hidden="true"
								/>
							</a>
						</li>
					{/if}

					{#each filteredVerticals as vertical (vertical.id)}
						<li>
							<a
								href={resolve('/(app)/admin/users/[verticalId]', { verticalId: vertical.id })}
								class="hover:bg-muted/40 active:bg-muted/60 flex min-h-16 items-center gap-3 px-3.5 py-3.5 transition-colors lg:grid lg:grid-cols-[minmax(0,1fr)_8rem_minmax(0,14rem)_1.25rem] lg:gap-4 lg:px-4 lg:py-3"
							>
								<span class="flex min-w-0 flex-1 items-center gap-3 lg:flex-none">
									<span
										class="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl text-sm font-semibold lg:size-10"
										aria-hidden="true"
									>
										{vertical.name.trim().charAt(0).toUpperCase() || '?'}
									</span>
									<span class="min-w-0">
										<span class="text-foreground block truncate font-medium">{vertical.name}</span>
										<span class="text-muted-foreground mt-0.5 block text-sm lg:hidden">
											{vertical.total} people
										</span>
										<span class="mt-2 flex flex-wrap gap-2 lg:hidden">
											{#if vertical.pending > 0}
												<span
													class="bg-amber/15 text-amber inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
												>
													<StatusDot status="amber" />
													{vertical.pending} pending
												</span>
											{/if}
											{#if vertical.denied > 0}
												<span
													class="bg-orange/15 text-orange inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
												>
													<StatusDot status="orange" />
													{vertical.denied} denied
												</span>
											{/if}
										</span>
									</span>
								</span>

								<span class="text-foreground hidden text-sm font-medium lg:block">
									{vertical.total}
								</span>

								<span class="hidden flex-wrap items-center gap-2 lg:flex">
									{#if vertical.pending > 0}
										<span
											class="bg-amber/15 text-amber inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
										>
											<StatusDot status="amber" />
											{vertical.pending} pending
										</span>
									{/if}
									{#if vertical.denied > 0}
										<span
											class="bg-orange/15 text-orange inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
										>
											<StatusDot status="orange" />
											{vertical.denied} denied
										</span>
									{/if}
									{#if vertical.pending === 0 && vertical.denied === 0}
										<span class="text-muted-foreground text-sm">—</span>
									{/if}
								</span>

								<ChevronRight
									class="text-muted-foreground ml-auto size-4 shrink-0 lg:ml-0"
									aria-hidden="true"
								/>
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		{#if data.verticals.length === 0}
			<p class="text-muted-foreground px-0.5 text-sm">
				{#if data.canManageVerticals}
					No verticals yet. Add the first one below.
				{:else}
					No verticals yet. Ask an admin to create one.
				{/if}
			</p>
		{/if}
	</section>

	{#if data.canManageVerticals}
		<section class="border-border bg-muted/20 rounded-2xl border p-4 sm:p-5">
			<div class="mb-4 flex items-start gap-3 lg:mb-0 lg:items-center lg:justify-between">
				<div class="flex items-start gap-3">
					<span
						class="bg-background text-foreground border-border flex size-10 shrink-0 items-center justify-center rounded-xl border"
						aria-hidden="true"
					>
						<Plus class="size-4" />
					</span>
					<div class="min-w-0">
						<h2 class="text-foreground text-base font-medium">Add vertical</h2>
						<p class="text-muted-foreground mt-0.5 text-sm leading-relaxed">
							Product teams that people can be mapped to.
						</p>
					</div>
				</div>
			</div>

			<form
				method="POST"
				action="?/createVertical"
				class="mt-4 flex flex-col gap-3 lg:mt-5 lg:flex-row lg:items-end"
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
				<div class="flex min-w-0 flex-1 flex-col gap-2">
					<Label for="name">Name</Label>
					<Input
						id="name"
						name="name"
						required
						placeholder="e.g. Elixir Insights"
						value={form?.name ?? ''}
						aria-invalid={form?.error ? true : undefined}
						class="bg-background h-11 rounded-xl"
					/>
				</div>
				{#if form?.error}
					<p role="alert" class="text-destructive text-sm lg:hidden">{form.error}</p>
				{/if}
				<Button type="submit" class="h-11 w-full rounded-xl lg:w-auto lg:min-w-40" disabled={creating}>
					{creating ? 'Saving…' : 'Add vertical'}
				</Button>
			</form>
			{#if form?.error}
				<p role="alert" class="text-destructive mt-2 hidden text-sm lg:block">{form.error}</p>
			{/if}
		</section>
	{/if}
</div>
