<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '#lib/components/ui/button';
	import StatusDot from '#lib/components/ui/status-dot.svelte';
	import type { OrgDashboard } from '#lib/dashboard/org';
	import type { PersonalDashboard } from '#lib/dashboard/personal';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import Clock3 from '@lucide/svelte/icons/clock-3';
	import UserRound from '@lucide/svelte/icons/user-round';
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

	const punchCoverage = $derived(
		org.approvedHeadcount > 0
			? Math.min(100, Math.round((org.todayPunches / org.approvedHeadcount) * 100))
			: 0
	);
</script>

<div class="flex w-full flex-col gap-5 lg:gap-6">
	<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
		<div class="flex min-w-0 flex-col gap-1">
			<p class="text-muted-foreground text-sm leading-relaxed">{greeting}</p>
		</div>
		<div class="flex flex-wrap gap-2">
			<Button href={resolve('/(app)/admin/users')} class="h-10 rounded-xl">
				<Users class="size-4" />
				User management
			</Button>
			<Button href={resolve('/(app)/timesheet')} variant="outline" class="h-10 rounded-xl">
				<ClipboardList class="size-4" />
				Timesheet
			</Button>
			{#if showAttendance}
				<Button href={resolve('/(app)/attendance')} variant="outline" class="h-10 rounded-xl">
					Attendance
				</Button>
			{/if}
		</div>
	</div>

	{#if org.loadError}
		<p role="alert" class="text-destructive text-sm">{org.loadError}</p>
	{/if}

	<!-- Stats strip (Shopify / Cloudflare) -->
	<section class="border-border bg-card overflow-hidden rounded-2xl border">
		<div class="grid sm:grid-cols-2 lg:grid-cols-4">
			<div class="border-border border-b p-4 sm:border-r sm:p-5 lg:border-b-0">
				<p class="text-muted-foreground text-xs font-medium tracking-wide uppercase">People</p>
				<p class="text-foreground mt-2 text-3xl font-semibold tracking-tight tabular-nums">
					{org.people.total}
				</p>
				<p class="text-muted-foreground mt-1.5 text-xs">{org.people.approved} approved</p>
			</div>
			<div class="border-border border-b p-4 sm:border-r-0 sm:p-5 lg:border-r lg:border-b-0">
				<p class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
					Pending access
				</p>
				<p class="text-foreground mt-2 text-3xl font-semibold tracking-tight tabular-nums">
					{org.people.pending}
				</p>
				<p class="text-muted-foreground mt-1.5 text-xs">Awaiting approval</p>
			</div>
			<div class="border-border border-b p-4 sm:border-r sm:border-b-0 sm:p-5 lg:border-b-0">
				<p class="text-muted-foreground text-xs font-medium tracking-wide uppercase">Unassigned</p>
				<p class="text-foreground mt-2 text-3xl font-semibold tracking-tight tabular-nums">
					{org.people.unassigned}
				</p>
				<p class="text-muted-foreground mt-1.5 text-xs">No vertical yet</p>
			</div>
			<div class="p-4 sm:p-5">
				<p class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
					Today’s punches
				</p>
				<p class="text-foreground mt-2 text-3xl font-semibold tracking-tight tabular-nums">
					{org.todayPunches}
				</p>
				<p class="text-muted-foreground mt-1.5 text-xs">{punchHint}</p>
				{#if org.approvedHeadcount > 0}
					<div class="bg-muted mt-3 h-1.5 overflow-hidden rounded-full">
						<div
							class="bg-primary h-full rounded-full transition-[width]"
							style={`width: ${punchCoverage}%`}
						></div>
					</div>
				{/if}
			</div>
		</div>
	</section>

	{#if personal && ((personal.isManager || personal.pendingApprovals > 0) || personal.profileGaps.length > 0)}
		<div class="grid gap-3 lg:grid-cols-2">
			{#if personal.isManager || personal.pendingApprovals > 0}
				<a
					href={resolve('/(app)/attendance/approvals')}
					class="border-border bg-card hover:bg-muted/40 active:bg-muted/60 flex items-center gap-4 rounded-2xl border p-4 transition-colors sm:p-5"
				>
					<span
						class="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl"
						aria-hidden="true"
					>
						<Clock3 class="size-5" />
					</span>
					<span class="min-w-0 flex-1">
						<span class="text-foreground block font-medium">Your approvals</span>
						<span class="text-muted-foreground mt-0.5 block text-sm">
							{personal.pendingApprovals} pending leave or WFH request{personal.pendingApprovals ===
							1
								? ''
								: 's'}
						</span>
					</span>
					<span
						class="bg-primary text-primary-foreground inline-flex h-9 shrink-0 items-center rounded-xl px-3 text-sm font-medium"
					>
						Review
					</span>
				</a>
			{/if}

			{#if personal.profileGaps.length > 0}
				<a
					href={resolve('/(app)/profile')}
					class="border-border bg-card hover:bg-muted/40 active:bg-muted/60 flex items-center gap-4 rounded-2xl border p-4 transition-colors sm:p-5"
				>
					<span
						class="bg-amber/15 text-amber flex size-11 shrink-0 items-center justify-center rounded-xl"
						aria-hidden="true"
					>
						<UserRound class="size-5" />
					</span>
					<span class="min-w-0 flex-1">
						<span class="text-foreground block font-medium">Your profile</span>
						<span class="text-muted-foreground mt-0.5 block text-sm">
							{personal.profileGaps.length} field{personal.profileGaps.length === 1 ? '' : 's'} still
							needed
						</span>
						<span class="mt-2 flex flex-wrap gap-1.5">
							{#each personal.profileGaps as gap (gap)}
								<span
									class="border-border text-muted-foreground rounded-full border px-2 py-0.5 text-[11px]"
								>
									{gap}
								</span>
							{/each}
						</span>
					</span>
					<span
						class="border-border inline-flex h-9 shrink-0 items-center rounded-xl border px-3 text-sm font-medium"
					>
						Update
					</span>
				</a>
			{/if}
		</div>
	{/if}

	<section class="flex flex-col gap-3">
		<div class="flex items-baseline justify-between gap-3 px-0.5">
			<div>
				<h2 class="text-muted-foreground text-xs font-medium tracking-wide uppercase">Verticals</h2>
				<p class="text-muted-foreground mt-0.5 text-xs">
					{org.verticalCount} vertical{org.verticalCount === 1 ? '' : 's'} · {org.people.denied}
					denied access
				</p>
			</div>
			<Button href={resolve('/(app)/admin/users')} variant="outline" size="sm" class="rounded-xl">
				Manage
			</Button>
		</div>

		{#if org.verticals.length === 0 && org.people.unassigned === 0}
			<div
				class="border-border bg-card text-muted-foreground rounded-2xl border border-dashed px-4 py-10 text-center text-sm"
			>
				No verticals yet. Create one in user management.
			</div>
		{:else}
			<div class="border-border bg-card overflow-hidden rounded-2xl border">
				<ul class="divide-border divide-y">
					<li>
						<a
							href={resolve('/(app)/admin/users/[verticalId]', { verticalId: 'pending' })}
							class="hover:bg-muted/40 active:bg-muted/60 flex min-h-16 items-center gap-3 px-3.5 py-3.5 transition-colors lg:px-4"
						>
							<span
								class="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-xl"
								aria-hidden="true"
							>
								<Users class="size-4" />
							</span>
							<span class="min-w-0 flex-1">
								<span class="text-foreground block font-medium">Unassigned</span>
								<span class="text-muted-foreground mt-0.5 block text-sm">
									{org.people.unassigned} people
								</span>
							</span>
							<ChevronRight class="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
						</a>
					</li>

					{#each org.verticals as vertical (vertical.id)}
						<li>
							<a
								href={resolve('/(app)/admin/users/[verticalId]', { verticalId: vertical.id })}
								class="hover:bg-muted/40 active:bg-muted/60 flex min-h-16 items-center gap-3 px-3.5 py-3.5 transition-colors lg:px-4"
							>
								<span
									class="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl text-xs font-semibold"
									aria-hidden="true"
								>
									{vertical.name.slice(0, 2).toUpperCase()}
								</span>
								<span class="min-w-0 flex-1">
									<span class="text-foreground block font-medium">{vertical.name}</span>
									<span
										class="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"
									>
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
									</span>
								</span>
								<ChevronRight class="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</section>
</div>
