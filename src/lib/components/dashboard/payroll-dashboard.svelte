<script lang="ts">
	import { resolve } from '$app/paths';
	import Stat from '#lib/components/dashboard/stat.svelte';
	import { Button } from '#lib/components/ui/button';
	import type { PayrollDashboard } from '#lib/dashboard/payroll';
	import { profileDisplayName } from '#lib/profile/display';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import Users from '@lucide/svelte/icons/users';

	let {
		data,
		showAttendance = true
	}: {
		data: PayrollDashboard;
		showAttendance?: boolean;
	} = $props();

	const punchCoverage = $derived(
		data.people.approved > 0
			? `${Math.min(100, Math.round((data.todayPunches / data.people.approved) * 100))}%`
			: '—'
	);

	const punchPct = $derived(
		data.people.approved > 0
			? Math.min(100, Math.round((data.todayPunches / data.people.approved) * 100))
			: 0
	);
</script>

<div class="flex w-full max-w-full min-w-0 flex-col gap-5 lg:gap-6">
	<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
		<div class="flex min-w-0 flex-col gap-1">
			<p class="text-muted-foreground text-sm leading-relaxed">
				{data.monthLabel} · headcount, IDs, and attendance readiness.
			</p>
		</div>
		<div class="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
			<Button href={resolve('/(app)/admin/users')} class="h-11 w-full rounded-xl sm:h-10 sm:w-auto">
				<Users class="size-4" />
				User management
			</Button>
			<Button
				href={resolve('/(app)/timesheet')}
				variant="outline"
				class="h-11 w-full rounded-xl sm:h-10 sm:w-auto"
			>
				<ClipboardList class="size-4" />
				Timesheet
			</Button>
			{#if showAttendance}
				<Button
					href={resolve('/(app)/attendance')}
					variant="outline"
					class="col-span-2 h-11 w-full rounded-xl sm:col-span-1 sm:h-10 sm:w-auto"
				>
					Attendance
				</Button>
			{/if}
		</div>
	</div>

	{#if data.loadError}
		<p role="alert" class="text-destructive text-sm">{data.loadError}</p>
	{/if}

	<section class="border-border bg-card overflow-hidden rounded-2xl border">
		<div class="grid sm:grid-cols-2 lg:grid-cols-4">
			<div class="border-border border-b p-4 sm:border-r sm:p-5 lg:border-b-0">
				<p class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
					Approved people
				</p>
				<p class="text-foreground mt-2 text-3xl font-semibold tracking-tight tabular-nums">
					{data.people.approved}
				</p>
				<p class="text-muted-foreground mt-1.5 text-xs">
					{data.people.total} total · {data.verticalCount} verticals
				</p>
			</div>
			<div class="border-border border-b p-4 sm:p-5 lg:border-r lg:border-b-0">
				<p class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
					Pending access
				</p>
				<p class="text-foreground mt-2 text-3xl font-semibold tracking-tight tabular-nums">
					{data.people.pending}
				</p>
				<p class="text-muted-foreground mt-1.5 text-xs">{data.people.unassigned} unassigned</p>
			</div>
			<div class="border-border border-b p-4 sm:border-r sm:border-b-0 sm:p-5 lg:border-b-0">
				<p class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
					Missing employee ID
				</p>
				<p class="text-foreground mt-2 text-3xl font-semibold tracking-tight tabular-nums">
					{data.people.missingEmployeeId}
				</p>
				<p class="text-muted-foreground mt-1.5 text-xs">Approved people only</p>
			</div>
			<div class="p-4 sm:p-5">
				<p class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
					Today’s coverage
				</p>
				<p class="text-foreground mt-2 text-3xl font-semibold tracking-tight tabular-nums">
					{punchCoverage}
				</p>
				<p class="text-muted-foreground mt-1.5 text-xs">
					{data.todayPunches} of {data.people.approved} logged
				</p>
				{#if data.people.approved > 0}
					<div class="bg-muted mt-3 h-1.5 overflow-hidden rounded-full">
						<div
							class="bg-primary h-full rounded-full transition-[width]"
							style={`width: ${punchPct}%`}
						></div>
					</div>
				{/if}
			</div>
		</div>
	</section>

	<div class="grid gap-3 sm:grid-cols-3">
		<Stat label="Month attendance rows" value={data.monthAttendanceDays} hint={data.monthLabel} />
		<Stat label="Pending leave" value={data.pendingLeave} hint="Across the org" />
		<Stat label="Pending WFH" value={data.pendingWfh} hint="Across the org" />
	</div>

	<div class="grid gap-5 lg:grid-cols-2 lg:gap-6">
		<section class="flex flex-col gap-3">
			<div class="flex items-baseline justify-between gap-3 px-0.5">
				<div>
					<h2 class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
						Needs attention
					</h2>
					<p class="text-muted-foreground mt-0.5 text-xs">
						Approved people missing payroll-critical details.
					</p>
				</div>
				<Button href={resolve('/(app)/admin/users')} variant="outline" size="sm" class="rounded-xl">
					Manage
				</Button>
			</div>

			{#if data.attention.length === 0}
				<div
					class="border-border bg-card text-muted-foreground rounded-2xl border border-dashed px-4 py-10 text-center text-sm"
				>
					Everyone approved has the basics filled in.
				</div>
			{:else}
				<ul class="border-border bg-card divide-border overflow-hidden rounded-2xl border divide-y">
					{#each data.attention as person (person.id)}
						<li class="px-3.5 py-3.5 lg:px-4">
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0">
									<p class="text-foreground text-sm font-medium">{profileDisplayName(person)}</p>
									<p class="text-muted-foreground truncate text-xs">
										{person.email}
										{#if person.vertical_name}
											· {person.vertical_name}
										{/if}
									</p>
								</div>
								{#if person.vertical_id}
									<Button
										href={resolve('/(app)/admin/users/[verticalId]/[userId]', {
											verticalId: person.vertical_id,
											userId: person.id
										})}
										variant="outline"
										size="sm"
										class="rounded-xl"
									>
										Open
									</Button>
								{:else}
									<Button
										href={resolve('/(app)/admin/users/[verticalId]', {
											verticalId: 'pending'
										})}
										variant="outline"
										size="sm"
										class="rounded-xl"
									>
										Open
									</Button>
								{/if}
							</div>
							<ul class="mt-2 flex flex-wrap gap-1.5">
								{#each person.issues as issue (issue)}
									<li
										class="border-border text-muted-foreground rounded-full border px-2 py-0.5 text-[11px]"
									>
										{issue}
									</li>
								{/each}
							</ul>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section class="flex flex-col gap-3">
			<div class="px-0.5">
				<h2 class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
					Quick links
				</h2>
				<p class="text-muted-foreground mt-0.5 text-xs">Common payroll workflows.</p>
			</div>

			<ul class="border-border bg-card divide-border overflow-hidden rounded-2xl border divide-y">
				<li>
					<a
						href={resolve('/(app)/admin/users/[verticalId]', { verticalId: 'pending' })}
						class="hover:bg-muted/40 flex items-center gap-3 px-3.5 py-3.5 transition-colors lg:px-4"
					>
						<span class="min-w-0 flex-1">
							<span class="text-foreground block text-sm font-medium">Unassigned people</span>
							<span class="text-muted-foreground mt-0.5 block text-xs">
								{data.people.unassigned} waiting for a vertical
							</span>
						</span>
						<span class="text-muted-foreground text-sm tabular-nums">{data.people.unassigned}</span>
						<ChevronRight class="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
					</a>
				</li>
				<li>
					<a
						href={resolve('/(app)/timesheet')}
						class="hover:bg-muted/40 flex items-center gap-3 px-3.5 py-3.5 transition-colors lg:px-4"
					>
						<span class="min-w-0 flex-1">
							<span class="text-foreground block text-sm font-medium">Monthly timesheet</span>
							<span class="text-muted-foreground mt-0.5 block text-xs">
								{data.monthAttendanceDays} attendance rows in {data.monthLabel}
							</span>
						</span>
						<ChevronRight class="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
					</a>
				</li>
				<li>
					<a
						href={resolve('/(app)/admin/users')}
						class="hover:bg-muted/40 flex items-center gap-3 px-3.5 py-3.5 transition-colors lg:px-4"
					>
						<span class="min-w-0 flex-1">
							<span class="text-foreground block text-sm font-medium">Access queue</span>
							<span class="text-muted-foreground mt-0.5 block text-xs">
								{data.people.pending} pending · {data.people.denied} denied
							</span>
						</span>
						<span class="text-muted-foreground text-sm tabular-nums">{data.people.pending}</span>
						<ChevronRight class="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
					</a>
				</li>
			</ul>
		</section>
	</div>
</div>
