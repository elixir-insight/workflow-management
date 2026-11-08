<script lang="ts">
	import { resolve } from '$app/paths';
	import RequestStatusBadge from '#lib/components/attendance/request-status-badge.svelte';
	import { Button } from '#lib/components/ui/button';
	import type { PersonalDashboard } from '#lib/dashboard/personal';
	import { profileDisplayName } from '#lib/profile/display';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import ClipboardCheck from '@lucide/svelte/icons/clipboard-check';
	import Clock3 from '@lucide/svelte/icons/clock-3';
	import House from '@lucide/svelte/icons/house';
	import UserRound from '@lucide/svelte/icons/user-round';

	let {
		data,
		email = '',
		firstName = '',
		lastName = ''
	}: {
		data: PersonalDashboard;
		email?: string;
		firstName?: string;
		lastName?: string;
	} = $props();

	const displayName = $derived(
		profileDisplayName({
			first_name: firstName || data.profile.first_name,
			last_name: lastName || data.profile.last_name,
			email
		})
	);

	const inValue = $derived(data.todayAttendance?.in_time?.slice(0, 5) ?? null);
	const outValue = $derived(data.todayAttendance?.out_time?.slice(0, 5) ?? null);
	const todayHours = $derived(
		data.recentDays.find((day) => day.work_date === data.today)?.hoursLabel ?? '—'
	);

	const dayStatus = $derived(
		inValue && outValue ? 'Day logged' : inValue ? 'Checked in' : 'Not checked in'
	);

	const ownPending = $derived(
		data.leaveRequests.filter((r) => r.status === 'pending').length +
			data.wfhRequests.filter((r) => r.status === 'pending').length
	);

	function formatListDate(iso: string) {
		return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
			timeZone: 'UTC'
		});
	}

	function leaveKindLabel(kind: string) {
		if (kind === 'lop') return 'LOP';
		return kind.charAt(0).toUpperCase() + kind.slice(1);
	}
</script>

<div class="flex w-full flex-col gap-5 lg:gap-6">
	<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
		<div class="flex min-w-0 flex-col gap-1">
			<h2 class="text-foreground text-xl font-semibold tracking-tight lg:text-2xl">
				Hello, {displayName}
			</h2>
			<p class="text-muted-foreground text-sm leading-relaxed">
				{formatListDate(data.today)} · {dayStatus}
				{#if data.profile.employee_id}
					· {data.profile.employee_id}
				{/if}
			</p>
			<p class="text-muted-foreground text-sm">
				{#if data.manager}
					Reports to {profileDisplayName(data.manager)}
				{:else}
					No reporting lead mapped
				{/if}
			</p>
		</div>
		<div class="flex flex-wrap gap-2">
			<Button href={resolve('/(app)/attendance')} class="h-10 rounded-xl">
				<Clock3 class="size-4" />
				Log times
			</Button>
			<Button href={resolve('/(app)/attendance/leave')} variant="outline" class="h-10 rounded-xl">
				<CalendarDays class="size-4" />
				Leave
			</Button>
			<Button href={resolve('/(app)/attendance/wfh')} variant="outline" class="h-10 rounded-xl">
				<House class="size-4" />
				WFH
			</Button>
			{#if data.isManager || data.pendingApprovals > 0}
				<Button href={resolve('/(app)/attendance/approvals')} class="h-10 rounded-xl">
					<ClipboardCheck class="size-4" />
					Approvals
					{#if data.pendingApprovals > 0}
						<span class="bg-primary-foreground/20 rounded-md px-1.5 text-xs">
							{data.pendingApprovals}
						</span>
					{/if}
				</Button>
			{/if}
		</div>
	</div>

	<section class="border-border bg-card overflow-hidden rounded-2xl border">
		<div class="grid sm:grid-cols-2 lg:grid-cols-5">
			<div class="border-border border-b p-4 sm:border-r sm:p-5 lg:border-b-0">
				<p class="text-muted-foreground text-xs font-medium tracking-wide uppercase">Casual</p>
				<p class="text-foreground mt-2 text-3xl font-semibold tracking-tight tabular-nums">
					{data.profile.casual_leave}
				</p>
				<p class="text-muted-foreground mt-1.5 text-xs">Days available</p>
			</div>
			<div class="border-border border-b p-4 sm:p-5 lg:border-r lg:border-b-0">
				<p class="text-muted-foreground text-xs font-medium tracking-wide uppercase">Earned</p>
				<p class="text-foreground mt-2 text-3xl font-semibold tracking-tight tabular-nums">
					{data.profile.earned_leave}
				</p>
				<p class="text-muted-foreground mt-1.5 text-xs">Days available</p>
			</div>
			<div class="border-border border-b p-4 sm:border-r sm:border-b-0 sm:p-5 lg:border-b-0">
				<p class="text-muted-foreground text-xs font-medium tracking-wide uppercase">In today</p>
				<p class="text-foreground mt-2 text-3xl font-semibold tracking-tight tabular-nums">
					{inValue ?? '—'}
				</p>
			</div>
			<div class="border-border border-b p-4 sm:border-b-0 sm:p-5 lg:border-r">
				<p class="text-muted-foreground text-xs font-medium tracking-wide uppercase">Out today</p>
				<p class="text-foreground mt-2 text-3xl font-semibold tracking-tight tabular-nums">
					{outValue ?? '—'}
				</p>
			</div>
			<div class="border-border col-span-full border-t p-4 sm:p-5 lg:col-span-1 lg:border-t-0">
				<p class="text-muted-foreground text-xs font-medium tracking-wide uppercase">Hours today</p>
				<p class="text-foreground mt-2 text-3xl font-semibold tracking-tight tabular-nums">
					{todayHours}
				</p>
			</div>
		</div>
	</section>

	{#if ownPending > 0 || data.pendingApprovals > 0 || data.profileGaps.length > 0}
		<div class="grid gap-3 lg:grid-cols-2">
			{#if ownPending > 0}
				<a
					href={resolve('/(app)/attendance')}
					class="border-border bg-card hover:bg-muted/40 flex items-center gap-4 rounded-2xl border p-4 transition-colors sm:p-5"
				>
					<span class="min-w-0 flex-1">
						<span class="text-foreground block font-medium">Your open requests</span>
						<span class="text-muted-foreground mt-0.5 block text-sm">
							{ownPending} leave or WFH item{ownPending === 1 ? '' : 's'} still pending
						</span>
					</span>
					<span class="border-border rounded-xl border px-3 py-2 text-sm font-medium">Open</span>
				</a>
			{/if}
			{#if data.pendingApprovals > 0}
				<a
					href={resolve('/(app)/attendance/approvals')}
					class="border-border bg-card hover:bg-muted/40 flex items-center gap-4 rounded-2xl border p-4 transition-colors sm:p-5"
				>
					<span class="min-w-0 flex-1">
						<span class="text-foreground block font-medium">Waiting on you</span>
						<span class="text-muted-foreground mt-0.5 block text-sm">
							{data.pendingApprovals} request{data.pendingApprovals === 1 ? '' : 's'} from your reports
						</span>
					</span>
					<span
						class="bg-primary text-primary-foreground rounded-xl px-3 py-2 text-sm font-medium"
					>
						Review
					</span>
				</a>
			{/if}
			{#if data.profileGaps.length > 0}
				<a
					href={resolve('/(app)/profile')}
					class="border-border bg-card hover:bg-muted/40 flex items-center gap-4 rounded-2xl border p-4 transition-colors sm:p-5 lg:col-span-2"
				>
					<span
						class="bg-amber/15 text-amber flex size-11 shrink-0 items-center justify-center rounded-xl"
						aria-hidden="true"
					>
						<UserRound class="size-5" />
					</span>
					<span class="min-w-0 flex-1">
						<span class="text-foreground block font-medium">Finish your profile</span>
						<span class="text-muted-foreground mt-0.5 block text-sm">
							{data.profileGaps.length} field{data.profileGaps.length === 1 ? '' : 's'} still needed
						</span>
					</span>
					<span class="border-border rounded-xl border px-3 py-2 text-sm font-medium">Update</span>
				</a>
			{/if}
		</div>
	{/if}

	<section class="flex flex-col gap-3">
		<div class="flex items-baseline justify-between gap-3 px-0.5">
			<div>
				<h2 class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
					Daily hours
				</h2>
				<p class="text-muted-foreground mt-0.5 text-xs">Clocked time for the last 14 days.</p>
			</div>
			<Button href={resolve('/(app)/attendance')} variant="outline" size="sm" class="rounded-xl">
				Log times
			</Button>
		</div>

		{#if data.recentDays.length === 0}
			<div
				class="border-border bg-card text-muted-foreground rounded-2xl border border-dashed px-4 py-10 text-center text-sm"
			>
				No attendance logged yet.
			</div>
		{:else}
			<div class="border-border bg-card overflow-hidden rounded-2xl border">
				<ul class="divide-border divide-y">
					{#each data.recentDays as day (day.work_date)}
						<li class="flex items-center justify-between gap-3 px-3.5 py-3 lg:px-4">
							<div class="min-w-0">
								<p class="text-foreground text-sm font-medium">{formatListDate(day.work_date)}</p>
								<p class="text-muted-foreground text-xs">
									{(day.in_time?.slice(0, 5) ?? '—') + ' → ' + (day.out_time?.slice(0, 5) ?? '—')}
								</p>
							</div>
							<p class="text-foreground text-sm font-medium tabular-nums">{day.hoursLabel}</p>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</section>

	<div class="grid gap-5 lg:grid-cols-2 lg:gap-6">
		<section class="flex flex-col gap-3">
			<div class="flex items-baseline justify-between gap-3 px-0.5">
				<h2 class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
					Recent leave
				</h2>
				<Button
					href={resolve('/(app)/attendance/leave')}
					variant="outline"
					size="sm"
					class="rounded-xl"
				>
					View all
				</Button>
			</div>
			{#if data.leaveRequests.length === 0}
				<div
					class="border-border bg-card text-muted-foreground rounded-2xl border border-dashed px-4 py-8 text-center text-sm"
				>
					No leave requests yet.
				</div>
			{:else}
				<ul class="border-border bg-card divide-border overflow-hidden rounded-2xl border divide-y">
					{#each data.leaveRequests as request (request.id)}
						<li class="flex items-start justify-between gap-3 px-3.5 py-3.5">
							<div class="min-w-0">
								<p class="text-foreground text-sm font-medium">
									{leaveKindLabel(request.leave_kind)} · {request.day_count} day{request.day_count ===
									1
										? ''
										: 's'}
								</p>
								<p class="text-muted-foreground mt-0.5 text-xs">
									{request.start_date}
									{#if request.end_date !== request.start_date}
										→ {request.end_date}
									{/if}
								</p>
							</div>
							<RequestStatusBadge status={request.status} class="rounded-full" />
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section class="flex flex-col gap-3">
			<div class="flex items-baseline justify-between gap-3 px-0.5">
				<h2 class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
					Recent WFH
				</h2>
				<Button
					href={resolve('/(app)/attendance/wfh')}
					variant="outline"
					size="sm"
					class="rounded-xl"
				>
					View all
				</Button>
			</div>
			{#if data.wfhRequests.length === 0}
				<div
					class="border-border bg-card text-muted-foreground rounded-2xl border border-dashed px-4 py-8 text-center text-sm"
				>
					No WFH requests yet.
				</div>
			{:else}
				<ul class="border-border bg-card divide-border overflow-hidden rounded-2xl border divide-y">
					{#each data.wfhRequests as request (request.id)}
						<li class="flex items-start justify-between gap-3 px-3.5 py-3.5">
							<div class="min-w-0">
								<p class="text-foreground text-sm font-medium">
									{formatListDate(request.work_date)}
								</p>
								<p class="text-muted-foreground mt-0.5 truncate text-xs">
									{request.reason || 'No reason noted'}
								</p>
							</div>
							<RequestStatusBadge status={request.status} class="rounded-full" />
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	</div>
</div>
