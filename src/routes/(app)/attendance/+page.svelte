<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import RequestStatusBadge from '#lib/components/attendance/request-status-badge.svelte';
	import { Button } from '#lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader } from '#lib/components/ui/card';
	import { Input } from '#lib/components/ui/input';
	import { Label } from '#lib/components/ui/label';
	import TimeInput from '#lib/components/ui/time-input.svelte';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import ClipboardCheck from '@lucide/svelte/icons/clipboard-check';
	import House from '@lucide/svelte/icons/house';
	import { toast } from 'svelte-sonner';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let savingTimes = $state(false);
	let selectedDate = $state(data.selectedDate);

	$effect(() => {
		selectedDate = data.selectedDate;
	});

	const inValue = $derived(data.selectedAttendance?.in_time?.slice(0, 5) ?? '');
	const outValue = $derived(data.selectedAttendance?.out_time?.slice(0, 5) ?? '');

	function onDateChange(event: Event) {
		const value = (event.currentTarget as HTMLInputElement).value;
		if (!value) return;
		selectedDate = value;
		goto(`/attendance?date=${value}`, { replaceState: true });
	}
</script>

<svelte:head>
	<title>Attendance · ElixirPay</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div>
			<p class="text-muted-foreground text-sm">Track your day, leave, and WFH.</p>
			{#if !data.profile.reports_to}
				<p class="text-muted-foreground mt-1 text-xs">
					No reporting lead is mapped — leave and WFH are captured immediately.
				</p>
			{/if}
		</div>
		<div class="flex flex-wrap gap-2">
			<Button href={resolve('/(app)/attendance/leave')} variant="outline" class="h-10">
				<CalendarDays class="size-4" />
				Apply leave
			</Button>
			<Button href={resolve('/(app)/attendance/wfh')} variant="outline" class="h-10">
				<House class="size-4" />
				WFH request
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

	<div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
		<Card>
			<CardHeader>
				<h2 class="text-foreground text-base font-medium">Leave balances</h2>
				<CardDescription>Available days for new requests.</CardDescription>
			</CardHeader>
			<CardContent class="grid grid-cols-2 gap-3">
				<div class="border-border rounded-lg border p-3">
					<p class="text-muted-foreground text-xs">Casual</p>
					<p class="text-foreground text-2xl font-medium">{data.profile.casual_leave}</p>
				</div>
				<div class="border-border rounded-lg border p-3">
					<p class="text-muted-foreground text-xs">Earned</p>
					<p class="text-foreground text-2xl font-medium">{data.profile.earned_leave}</p>
				</div>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<h2 class="text-foreground text-base font-medium">
					{data.isToday ? 'Today’s times' : 'Daily times'}
				</h2>
				<CardDescription>
					Pick any past day or today to log or edit in/out times.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					method="POST"
					action="?/saveTimes"
					class="flex flex-col gap-4"
					use:enhance={() => {
						savingTimes = true;
						return async ({ result, update }) => {
							try {
								await update();
								if (result.type === 'failure' && typeof result.data?.error === 'string') {
									toast.error(result.data.error);
								}
							} finally {
								savingTimes = false;
							}
						};
					}}
				>
					<div class="flex flex-col gap-2">
						<Label for="workDate">Date</Label>
						<Input
							id="workDate"
							name="workDate"
							type="date"
							required
							max={data.today}
							value={form?.workDate ?? selectedDate}
							class="h-11"
							onchange={onDateChange}
						/>
					</div>

					<div class="grid grid-cols-2 gap-3">
						<div class="flex flex-col gap-2">
							<Label for="inTime">In time</Label>
							<TimeInput id="inTime" name="inTime" value={inValue} />
						</div>
						<div class="flex flex-col gap-2">
							<Label for="outTime">Out time</Label>
							<TimeInput id="outTime" name="outTime" value={outValue} />
						</div>
					</div>
					{#if form?.times && form?.error}
						<p role="alert" class="text-destructive text-sm">{form.error}</p>
					{/if}
					<Button type="submit" class="h-10 w-full" disabled={savingTimes}>
						{savingTimes ? 'Saving…' : 'Save times'}
					</Button>
				</form>
			</CardContent>
		</Card>
	</div>

	<Card>
		<CardHeader>
			<h2 class="text-foreground text-base font-medium">Recent days</h2>
			<CardDescription>Last 30 days with logged times. Tap a day to edit.</CardDescription>
		</CardHeader>
		<CardContent>
			{#if data.recentDays.length === 0}
				<p class="text-muted-foreground text-sm">No attendance logged yet.</p>
			{:else}
				<ul class="divide-border divide-y">
					{#each data.recentDays as day (day.work_date)}
						<li>
							<a
								href={`/attendance?date=${day.work_date}`}
								class="hover:bg-muted/40 flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
								aria-current={day.work_date === data.selectedDate ? 'page' : undefined}
							>
								<div class="min-w-0">
									<p class="text-foreground text-sm font-medium">
										{day.work_date}
										{#if day.work_date === data.today}
											<span class="text-muted-foreground font-normal">· Today</span>
										{/if}
									</p>
									<p class="text-muted-foreground text-xs">
										{(day.in_time?.slice(0, 5) ?? '—') + ' → ' + (day.out_time?.slice(0, 5) ?? '—')}
									</p>
								</div>
								<p class="text-foreground text-sm font-medium tabular-nums">{day.hoursLabel}</p>
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</CardContent>
	</Card>

	<div class="grid gap-4 lg:grid-cols-2">
		<Card>
			<CardHeader class="flex-row items-center justify-between gap-3 space-y-0">
				<div>
					<h2 class="text-foreground text-base font-medium">Recent leave</h2>
					<CardDescription>Your latest leave applications.</CardDescription>
				</div>
				<Button href={resolve('/(app)/attendance/leave')} variant="outline" size="sm">View all</Button>
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
										{request.leave_kind === 'lop' ? 'LOP' : request.leave_kind} ·
										{request.day_count} day{request.day_count === 1 ? '' : 's'}
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
					<CardDescription>Your latest work-from-home requests.</CardDescription>
				</div>
				<Button href={resolve('/(app)/attendance/wfh')} variant="outline" size="sm">View all</Button>
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
