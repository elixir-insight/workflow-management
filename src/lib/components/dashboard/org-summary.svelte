<script lang="ts">
	import { resolve } from '$app/paths';
	import Stat from '#lib/components/dashboard/stat.svelte';
	import { Button } from '#lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader } from '#lib/components/ui/card';
	import StatusDot from '#lib/components/ui/status-dot.svelte';
	import type { OrgDashboard } from '#lib/dashboard/org';
	import type { PersonalDashboard } from '#lib/dashboard/personal';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import Users from '@lucide/svelte/icons/users';

	let {
		org,
		personal = null,
		showAttendance = true,
		greeting = 'Overview'
	}: {
		org: OrgDashboard;
		personal?: PersonalDashboard | null;
		showAttendance?: boolean;
		greeting?: string;
	} = $props();

	const punchHint = $derived(
		org.approvedHeadcount > 0
			? `${org.todayPunches} of ${org.approvedHeadcount} approved people`
			: 'Logged for today'
	);
</script>

<div class="flex flex-col gap-6">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div>
			<p class="text-muted-foreground text-sm">{greeting}</p>
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

	{#if org.loadError}
		<p role="alert" class="text-destructive text-sm">{org.loadError}</p>
	{/if}

	<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
		<Stat label="People" value={org.people.total} hint={`${org.people.approved} approved`} />
		<Stat label="Pending access" value={org.people.pending} hint="Awaiting approval" />
		<Stat label="Unassigned" value={org.people.unassigned} hint="No vertical yet" />
		<Stat label="Today’s punches" value={org.todayPunches} hint={punchHint} />
	</div>

	{#if personal && (personal.isManager || personal.pendingApprovals > 0)}
		<Card>
			<CardHeader class="flex-row items-center justify-between gap-3 space-y-0">
				<div>
					<h2 class="text-foreground text-base font-medium">Your approvals</h2>
					<CardDescription>
						{personal.pendingApprovals} pending leave or WFH request{personal.pendingApprovals ===
						1
							? ''
							: 's'} for your reports.
					</CardDescription>
				</div>
				<Button href={resolve('/(app)/attendance/approvals')} size="sm">Review</Button>
			</CardHeader>
		</Card>
	{/if}

	{#if personal && personal.profileGaps.length > 0}
		<Card>
			<CardHeader class="flex-row items-center justify-between gap-3 space-y-0">
				<div>
					<h2 class="text-foreground text-base font-medium">Your profile</h2>
					<CardDescription>
						{personal.profileGaps.length} field{personal.profileGaps.length === 1 ? '' : 's'} still
						needed.
					</CardDescription>
				</div>
				<Button href={resolve('/(app)/profile')} variant="outline" size="sm">Update</Button>
			</CardHeader>
			<CardContent>
				<ul class="text-muted-foreground flex flex-wrap gap-2 text-sm">
					{#each personal.profileGaps as gap (gap)}
						<li class="border-border rounded-md border px-2 py-1">{gap}</li>
					{/each}
				</ul>
			</CardContent>
		</Card>
	{/if}

	<div>
		<div class="mb-3 flex items-end justify-between gap-3">
			<div>
				<h2 class="text-foreground text-base font-medium">Verticals</h2>
				<p class="text-muted-foreground text-sm">
					{org.verticalCount} vertical{org.verticalCount === 1 ? '' : 's'} · {org.people.denied}
					denied access
				</p>
			</div>
		</div>

		<ul class="flex flex-col gap-3">
			<li>
				<a
					href={resolve('/(app)/admin/users/[verticalId]', { verticalId: 'pending' })}
					class="border-border hover:bg-muted/50 flex items-center gap-3 rounded-xl border p-4 transition-colors"
				>
					<div class="min-w-0 flex-1">
						<p class="text-foreground font-medium">Unassigned</p>
						<p class="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
							<span>{org.people.unassigned} people</span>
						</p>
					</div>
					<ChevronRight class="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
				</a>
			</li>

			{#each org.verticals as vertical (vertical.id)}
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

		{#if org.verticals.length === 0}
			<Card class="mt-3">
				<CardHeader>
					<CardDescription>No verticals yet. Create one in user management.</CardDescription>
				</CardHeader>
			</Card>
		{/if}
	</div>
</div>
