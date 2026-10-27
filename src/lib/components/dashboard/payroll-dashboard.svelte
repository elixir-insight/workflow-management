<script lang="ts">
	import { resolve } from '$app/paths';
	import Stat from '#lib/components/dashboard/stat.svelte';
	import { Button } from '#lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader } from '#lib/components/ui/card';
	import type { PayrollDashboard } from '#lib/dashboard/payroll';
	import { profileDisplayName } from '#lib/profile/display';
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
</script>

<div class="flex flex-col gap-6">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div>
			<h2 class="text-foreground text-xl font-medium tracking-tight">Payroll dashboard</h2>
			<p class="text-muted-foreground mt-1 text-sm">
				{data.monthLabel} · headcount, IDs, and attendance readiness.
			</p>
		</div>
		<div class="flex flex-wrap gap-2">
			<Button href={resolve('/(app)/admin/users')} class="h-10">
				<Users class="size-4" />
				User management
			</Button>
			<Button href={resolve('/(app)/timesheet')} variant="outline" class="h-10">
				<ClipboardList class="size-4" />
				Timesheet
			</Button>
			{#if showAttendance}
				<Button href={resolve('/(app)/attendance')} variant="outline" class="h-10">
					Attendance
				</Button>
			{/if}
		</div>
	</div>

	{#if data.loadError}
		<p role="alert" class="text-destructive text-sm">{data.loadError}</p>
	{/if}

	<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
		<Stat
			label="Approved people"
			value={data.people.approved}
			hint={`${data.people.total} total · ${data.verticalCount} verticals`}
		/>
		<Stat
			label="Pending access"
			value={data.people.pending}
			hint={`${data.people.unassigned} unassigned`}
		/>
		<Stat
			label="Missing employee ID"
			value={data.people.missingEmployeeId}
			hint="Approved people only"
		/>
		<Stat
			label="Today’s punch coverage"
			value={punchCoverage}
			hint={`${data.todayPunches} of ${data.people.approved} logged`}
		/>
	</div>

	<div class="grid gap-3 sm:grid-cols-3">
		<Stat
			label="Month attendance rows"
			value={data.monthAttendanceDays}
			hint={data.monthLabel}
		/>
		<Stat label="Pending leave" value={data.pendingLeave} hint="Across the org" />
		<Stat label="Pending WFH" value={data.pendingWfh} hint="Across the org" />
	</div>

	<div class="grid gap-4 lg:grid-cols-2">
		<Card>
			<CardHeader class="flex-row items-center justify-between gap-3 space-y-0">
				<div>
					<h2 class="text-foreground text-base font-medium">Needs attention</h2>
					<CardDescription>
						Approved people missing payroll-critical details.
					</CardDescription>
				</div>
				<Button href={resolve('/(app)/admin/users')} variant="outline" size="sm">
					Manage
				</Button>
			</CardHeader>
			<CardContent>
				{#if data.attention.length === 0}
					<p class="text-muted-foreground text-sm">Everyone approved has the basics filled in.</p>
				{:else}
					<ul class="flex flex-col gap-3">
						{#each data.attention as person (person.id)}
							<li class="border-border rounded-lg border p-3">
								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0">
										<p class="text-foreground text-sm font-medium">
											{profileDisplayName(person)}
										</p>
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
										>
											Open
										</Button>
									{/if}
								</div>
								<ul class="text-muted-foreground mt-2 flex flex-wrap gap-2 text-xs">
									{#each person.issues as issue (issue)}
										<li class="border-border rounded-md border px-2 py-0.5">{issue}</li>
									{/each}
								</ul>
							</li>
						{/each}
					</ul>
				{/if}
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<h2 class="text-foreground text-base font-medium">Quick links</h2>
				<CardDescription>Common payroll workflows.</CardDescription>
			</CardHeader>
			<CardContent class="flex flex-col gap-3">
				<a
					href={resolve('/(app)/admin/users/[verticalId]', { verticalId: 'pending' })}
					class="border-border hover:bg-muted/50 flex items-center justify-between rounded-lg border px-3 py-3 transition-colors"
				>
					<div>
						<p class="text-foreground text-sm font-medium">Unassigned people</p>
						<p class="text-muted-foreground text-xs">{data.people.unassigned} waiting for a vertical</p>
					</div>
					<span class="text-muted-foreground text-sm">{data.people.unassigned}</span>
				</a>
				<a
					href={resolve('/(app)/timesheet')}
					class="border-border hover:bg-muted/50 flex items-center justify-between rounded-lg border px-3 py-3 transition-colors"
				>
					<div>
						<p class="text-foreground text-sm font-medium">Monthly timesheet</p>
						<p class="text-muted-foreground text-xs">
							{data.monthAttendanceDays} attendance rows in {data.monthLabel}
						</p>
					</div>
					<span class="text-muted-foreground text-sm">Open</span>
				</a>
				<a
					href={resolve('/(app)/admin/users')}
					class="border-border hover:bg-muted/50 flex items-center justify-between rounded-lg border px-3 py-3 transition-colors"
				>
					<div>
						<p class="text-foreground text-sm font-medium">Access queue</p>
						<p class="text-muted-foreground text-xs">
							{data.people.pending} pending · {data.people.denied} denied
						</p>
					</div>
					<span class="text-muted-foreground text-sm">{data.people.pending}</span>
				</a>
			</CardContent>
		</Card>
	</div>
</div>
