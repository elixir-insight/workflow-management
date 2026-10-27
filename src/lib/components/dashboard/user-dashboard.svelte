<script lang="ts">
	import { resolve } from '$app/paths';
	import RequestStatusBadge from '#lib/components/attendance/request-status-badge.svelte';
	import Stat from '#lib/components/dashboard/stat.svelte';
	import { Button } from '#lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader } from '#lib/components/ui/card';
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

	const dayStatus = $derived(
		inValue && outValue
			? 'Day logged'
			: inValue
				? 'Checked in'
				: 'Not checked in'
	);

	const ownPending = $derived(
		data.leaveRequests.filter((r) => r.status === 'pending').length +
			data.wfhRequests.filter((r) => r.status === 'pending').length
	);
</script>

<div class="flex flex-col gap-6">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div>
			<h2 class="text-foreground text-xl font-medium tracking-tight">Hello, {displayName}</h2>
			<p class="text-muted-foreground mt-1 text-sm">
				{data.today} · {dayStatus}
				{#if data.profile.employee_id}
					· {data.profile.employee_id}
				{/if}
			</p>
		</div>
		<div class="flex flex-wrap gap-2">
			<Button href={resolve('/(app)/attendance')} class="h-10">
				<Clock3 class="size-4" />
				Log times
			</Button>
			<Button href={resolve('/(app)/attendance/leave')} variant="outline" class="h-10">
				<CalendarDays class="size-4" />
				Leave
			</Button>
			<Button href={resolve('/(app)/attendance/wfh')} variant="outline" class="h-10">
				<House class="size-4" />
				WFH
			</Button>
			{#if data.isManager || data.pendingApprovals > 0}
				<Button href={resolve('/(app)/attendance/approvals')} class="h-10">
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

	<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
		<Stat label="Casual leave" value={data.profile.casual_leave} hint="Days available" />
		<Stat label="Earned leave" value={data.profile.earned_leave} hint="Days available" />
		<Stat label="In today" value={inValue ?? '—'} hint={data.today} />
		<Stat label="Out today" value={outValue ?? '—'} hint={data.today} />
	</div>

	{#if ownPending > 0 || data.pendingApprovals > 0}
		<div class="grid gap-3 sm:grid-cols-2">
			{#if ownPending > 0}
				<Card>
					<CardHeader>
						<h3 class="text-foreground text-base font-medium">Your open requests</h3>
						<CardDescription>
							{ownPending} leave or WFH item{ownPending === 1 ? '' : 's'} still pending.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button href={resolve('/(app)/attendance')} variant="outline" class="h-10">
							Open attendance
						</Button>
					</CardContent>
				</Card>
			{/if}
			{#if data.pendingApprovals > 0}
				<Card>
					<CardHeader>
						<h3 class="text-foreground text-base font-medium">Waiting on you</h3>
						<CardDescription>
							{data.pendingApprovals} request{data.pendingApprovals === 1 ? '' : 's'} from your
							reports.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button href={resolve('/(app)/attendance/approvals')} class="h-10">Review now</Button>
					</CardContent>
				</Card>
			{/if}
		</div>
	{/if}

	{#if data.profileGaps.length > 0}
		<Card>
			<CardHeader class="flex-row items-center justify-between gap-3 space-y-0">
				<div>
					<h2 class="text-foreground text-base font-medium">Finish your profile</h2>
					<CardDescription>
						{data.profileGaps.length} field{data.profileGaps.length === 1 ? '' : 's'} still needed.
					</CardDescription>
				</div>
				<Button href={resolve('/(app)/profile')} variant="outline" size="sm">
					<UserRound class="size-4" />
					Update
				</Button>
			</CardHeader>
			<CardContent>
				<ul class="text-muted-foreground flex flex-wrap gap-2 text-sm">
					{#each data.profileGaps as gap (gap)}
						<li class="border-border rounded-md border px-2 py-1">{gap}</li>
					{/each}
				</ul>
			</CardContent>
		</Card>
	{/if}

	<div class="grid gap-4 lg:grid-cols-2">
		<Card>
			<CardHeader class="flex-row items-center justify-between gap-3 space-y-0">
				<div>
					<h2 class="text-foreground text-base font-medium">Recent leave</h2>
					<CardDescription>Latest applications.</CardDescription>
				</div>
				<Button href={resolve('/(app)/attendance/leave')} variant="outline" size="sm">
					View all
				</Button>
			</CardHeader>
			<CardContent>
				{#if data.leaveRequests.length === 0}
					<p class="text-muted-foreground text-sm">No leave requests yet.</p>
				{:else}
					<ul class="flex flex-col gap-3">
						{#each data.leaveRequests as request (request.id)}
							<li class="border-border flex items-start justify-between gap-3 rounded-lg border p-3">
								<div class="min-w-0">
									<p class="text-foreground text-sm font-medium capitalize">
										{request.leave_kind} · {request.day_count} day{request.day_count === 1
											? ''
											: 's'}
									</p>
									<p class="text-muted-foreground text-xs">
										{request.start_date}
										{#if request.end_date !== request.start_date}
											→ {request.end_date}
										{/if}
									</p>
								</div>
								<RequestStatusBadge status={request.status} />
							</li>
						{/each}
					</ul>
				{/if}
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex-row items-center justify-between gap-3 space-y-0">
				<div>
					<h2 class="text-foreground text-base font-medium">Recent WFH</h2>
					<CardDescription>Latest work-from-home requests.</CardDescription>
				</div>
				<Button href={resolve('/(app)/attendance/wfh')} variant="outline" size="sm">
					View all
				</Button>
			</CardHeader>
			<CardContent>
				{#if data.wfhRequests.length === 0}
					<p class="text-muted-foreground text-sm">No WFH requests yet.</p>
				{:else}
					<ul class="flex flex-col gap-3">
						{#each data.wfhRequests as request (request.id)}
							<li class="border-border flex items-start justify-between gap-3 rounded-lg border p-3">
								<div class="min-w-0">
									<p class="text-foreground text-sm font-medium">{request.work_date}</p>
									<p class="text-muted-foreground truncate text-xs">
										{request.reason || 'No reason noted'}
									</p>
								</div>
								<RequestStatusBadge status={request.status} />
							</li>
						{/each}
					</ul>
				{/if}
			</CardContent>
		</Card>
	</div>
</div>
