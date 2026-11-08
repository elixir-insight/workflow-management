<script lang="ts">
	import { resolve } from '$app/paths';
	import { roleLabels } from '#lib/auth/roles';
	import { accessStatusLabels } from '#lib/auth/status';
	import { Input } from '#lib/components/ui/input';
	import UserAvatar from '#lib/components/user-avatar.svelte';
	import { profileDisplayName } from '#lib/profile/display';
	import type { AccessStatus } from '#lib/supabase/database';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Search from '@lucide/svelte/icons/search';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type StatusFilter = 'all' | AccessStatus;

	let query = $state('');
	let statusFilter = $state<StatusFilter>('all');

	const filters = [
		{ id: 'all', label: 'All' },
		{ id: 'approved', label: 'Approved' },
		{ id: 'pending', label: 'Pending' },
		{ id: 'denied', label: 'Denied' }
	] as const satisfies ReadonlyArray<{ id: StatusFilter; label: string }>;

	const normalizedQuery = $derived(query.trim().toLowerCase());

	const filteredUsers = $derived(
		data.users.filter((person) => {
			if (statusFilter !== 'all' && person.status !== statusFilter) return false;
			if (!normalizedQuery) return true;

			const name = profileDisplayName({
				first_name: person.first_name,
				last_name: person.last_name,
				email: person.email
			}).toLowerCase();

			return (
				name.includes(normalizedQuery) ||
				person.email.toLowerCase().includes(normalizedQuery) ||
				(person.employee_id?.toLowerCase().includes(normalizedQuery) ?? false) ||
				(person.designation?.toLowerCase().includes(normalizedQuery) ?? false)
			);
		})
	);

	const statusChipClass = (status: AccessStatus) => {
		if (status === 'approved') return 'bg-success/15 text-success';
		if (status === 'pending') return 'bg-amber/15 text-amber';
		return 'bg-orange/15 text-orange';
	};
</script>

<svelte:head>
	<title>{data.vertical.name} · User management · ElixirPay</title>
</svelte:head>

<div class="flex w-full max-w-full min-w-0 flex-col gap-5 lg:gap-6">
	<a
		href={resolve('/(app)/admin/users')}
		class="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-sm transition-colors"
	>
		<ArrowLeft class="size-4" aria-hidden="true" />
		User management
	</a>

	<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
		<div class="flex min-w-0 flex-col gap-1">
			<h2 class="text-foreground text-xl font-semibold tracking-tight lg:text-2xl">
				{data.vertical.name}
			</h2>
			<p class="text-muted-foreground text-sm leading-relaxed">
				People mapped to this vertical.
			</p>
		</div>

		<label class="relative block w-full lg:max-w-sm">
			<span class="sr-only">Search people</span>
			<Search
				class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
				aria-hidden="true"
			/>
			<Input
				type="search"
				bind:value={query}
				placeholder="Search by name, email, or ID"
				class="bg-muted/40 h-11 rounded-xl border-transparent pr-3 pl-10 shadow-none"
			/>
		</label>
	</div>

	<div
		class="scroll-x-contain flex gap-2 pb-0.5 lg:overflow-visible [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden"
	>
		{#each filters as filter (filter.id)}
			<button
				type="button"
				class={[
					'h-9 shrink-0 rounded-full px-3.5 text-sm font-medium transition-colors',
					statusFilter === filter.id
						? 'bg-foreground text-background'
						: 'bg-muted text-muted-foreground hover:text-foreground'
				]}
				aria-pressed={statusFilter === filter.id}
				onclick={() => (statusFilter = filter.id)}
			>
				{filter.label}
			</button>
		{/each}
	</div>

	{#if data.loadError}
		<p role="alert" class="text-destructive text-sm">{data.loadError}</p>
	{:else if data.users.length === 0}
		<div
			class="border-border bg-muted/20 text-muted-foreground rounded-2xl border border-dashed px-4 py-12 text-center text-sm"
		>
			No one is in this vertical yet.
		</div>
	{:else if filteredUsers.length === 0}
		<div
			class="border-border bg-muted/20 text-muted-foreground rounded-2xl border border-dashed px-4 py-12 text-center text-sm"
		>
			No people match the current filters.
		</div>
	{:else}
		<div class="flex items-baseline justify-between gap-3 px-0.5">
			<h3 class="text-muted-foreground text-xs font-medium tracking-wide uppercase">People</h3>
			<p class="text-muted-foreground text-xs">{filteredUsers.length}</p>
		</div>

		<div class="border-border overflow-hidden rounded-2xl border">
			<div
				class="text-muted-foreground border-border bg-muted/30 hidden grid-cols-[minmax(0,2fr)_7.5rem_minmax(0,1.2fr)_minmax(0,1.1fr)_1.25rem] gap-4 border-b px-4 py-2.5 text-xs font-medium tracking-wide uppercase lg:grid"
				aria-hidden="true"
			>
				<span>Person</span>
				<span>Status</span>
				<span>Role</span>
				<span>Reports to</span>
				<span></span>
			</div>

			<ul class="divide-border divide-y">
				{#each filteredUsers as person (person.id)}
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
							class="hover:bg-muted/40 active:bg-muted/60 flex min-h-18 items-center gap-3 px-3.5 py-3.5 transition-colors lg:grid lg:min-h-16 lg:grid-cols-[minmax(0,2fr)_7.5rem_minmax(0,1.2fr)_minmax(0,1.1fr)_1.25rem] lg:gap-4 lg:px-4 lg:py-3"
						>
							<span class="flex min-w-0 flex-1 items-center gap-3 lg:flex-none">
								<UserAvatar
									firstName={person.first_name}
									lastName={person.last_name}
									email={person.email}
									size="sm"
									class="size-11 shrink-0 text-sm lg:size-10"
								/>
								<span class="min-w-0">
									<span class="flex min-w-0 flex-wrap items-center gap-2 lg:block">
										<span class="text-foreground truncate font-medium">{name}</span>
										<span
											class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium lg:hidden {statusChipClass(
												person.status
											)}"
										>
											{accessStatusLabels[person.status]}
										</span>
									</span>
									<span class="text-muted-foreground mt-0.5 block truncate text-sm">
										{person.email}
									</span>

									<span
										class="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs lg:hidden"
									>
										{#if person.role}
											<span
												class="bg-muted text-foreground/80 rounded-md px-1.5 py-0.5 font-medium"
											>
												{roleLabels[person.role]}
											</span>
										{/if}
										{#if person.designation}
											<span>{person.designation}</span>
										{/if}
										{#if person.employee_id}
											<span>ID {person.employee_id}</span>
										{/if}
									</span>

									<span class="text-muted-foreground mt-1 block text-xs lg:hidden">
										{#if person.reportsToName}
											Reports to {person.reportsToName}
										{:else}
											No reporting lead
										{/if}
										{#if person.timesheet_exempt}
											· Timesheet exempt
										{/if}
									</span>
								</span>
							</span>

							<span class="hidden lg:flex lg:items-center">
								<span
									class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium {statusChipClass(
										person.status
									)}"
								>
									{accessStatusLabels[person.status]}
								</span>
							</span>

							<span class="hidden min-w-0 lg:block">
								{#if person.role}
									<span class="text-foreground block truncate text-sm font-medium">
										{roleLabels[person.role]}
									</span>
								{:else}
									<span class="text-muted-foreground block text-sm">No role</span>
								{/if}
								<span class="text-muted-foreground mt-0.5 block truncate text-xs">
									{#if person.designation}
										{person.designation}
									{/if}
									{#if person.designation && person.employee_id}
										·
									{/if}
									{#if person.employee_id}
										ID {person.employee_id}
									{/if}
									{#if !person.designation && !person.employee_id}
										—
									{/if}
								</span>
							</span>

							<span class="text-muted-foreground hidden min-w-0 text-sm lg:block">
								<span class="block truncate">
									{person.reportsToName ?? 'No reporting lead'}
								</span>
								{#if person.timesheet_exempt}
									<span class="mt-0.5 block text-xs">Timesheet exempt</span>
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
</div>
