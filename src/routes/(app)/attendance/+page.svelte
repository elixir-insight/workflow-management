<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { clockedHours, formatHours } from '#lib/attendance/hours';
	import RequestStatusBadge from '#lib/components/attendance/request-status-badge.svelte';
	import { Button } from '#lib/components/ui/button';
	import DateInput from '#lib/components/ui/date-input.svelte';
	import TimeInput from '#lib/components/ui/time-input.svelte';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import ClipboardCheck from '@lucide/svelte/icons/clipboard-check';
	import House from '@lucide/svelte/icons/house';
	import { toast } from 'svelte-sonner';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let savingTimes = $state(false);

	const workDate = $derived(form?.workDate ?? data.selectedDate);
	const inValue = $derived(data.selectedAttendance?.in_time?.slice(0, 5) ?? '');
	const outValue = $derived(data.selectedAttendance?.out_time?.slice(0, 5) ?? '');
	const selectedHoursLabel = $derived(formatHours(clockedHours(inValue, outValue)));

	const loggedDates = $derived(new Set(data.recentDays.map((day) => day.work_date)));

	const dayStrip = $derived(
		Array.from({ length: 14 }, (_, index) => {
			const date = addDays(data.today, index - 13);
			return {
				date,
				dayNumber: Number(date.slice(8)),
				weekday: weekdayShort(date),
				isToday: date === data.today,
				isSelected: date === data.selectedDate,
				hasLog: loggedDates.has(date)
			};
		})
	);

	function addDays(iso: string, delta: number) {
		const date = new Date(`${iso}T00:00:00Z`);
		date.setUTCDate(date.getUTCDate() + delta);
		return date.toISOString().slice(0, 10);
	}

	function weekdayShort(iso: string) {
		return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', {
			weekday: 'short',
			timeZone: 'UTC'
		});
	}

	function formatDayHeading(iso: string) {
		return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', {
			weekday: 'long',
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			timeZone: 'UTC'
		});
	}

	function formatListDate(iso: string) {
		return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
			timeZone: 'UTC'
		});
	}

	function goToDate(value: string) {
		if (!value || value > data.today) return;
		goto(`/attendance?date=${value}`, { replaceState: true });
	}

	function shiftDate(delta: number) {
		const next = addDays(data.selectedDate, delta);
		if (next > data.today) return;
		goToDate(next);
	}

	function onDateChange(event: Event) {
		goToDate((event.currentTarget as HTMLInputElement).value);
	}

	function leaveKindLabel(kind: string) {
		if (kind === 'lop') return 'LOP';
		return kind.charAt(0).toUpperCase() + kind.slice(1);
	}
</script>

<svelte:head>
	<title>Attendance · ElixirPay</title>
</svelte:head>

<div class="flex w-full max-w-full min-w-0 flex-col gap-5 lg:gap-6">
	<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
		<div class="flex min-w-0 flex-col gap-1">
			<p class="text-muted-foreground text-sm leading-relaxed">
				Track your day, leave, and WFH.
			</p>
			{#if !data.profile.reports_to}
				<p class="text-muted-foreground text-xs">
					No reporting lead is mapped — leave and WFH are captured immediately.
				</p>
			{/if}
		</div>

		<div class="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
			<Button
				href={resolve('/(app)/attendance/leave')}
				variant="outline"
				class="h-11 w-full rounded-xl sm:h-10 sm:w-auto"
			>
				<CalendarDays class="size-4" />
				Apply leave
			</Button>
			<Button
				href={resolve('/(app)/attendance/wfh')}
				variant="outline"
				class="h-11 w-full rounded-xl sm:h-10 sm:w-auto"
			>
				<House class="size-4" />
				WFH request
			</Button>
			{#if data.isManager || data.pendingApprovals > 0}
				<Button
					href={resolve('/(app)/attendance/approvals')}
					class="col-span-2 h-11 w-full rounded-xl sm:col-span-1 sm:h-10 sm:w-auto"
				>
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

	<section
		class="border-border grid gap-3 rounded-2xl border p-3 sm:grid-cols-2 sm:p-4 lg:max-w-md"
	>
		<div class="bg-muted/30 rounded-xl px-3.5 py-3">
			<p class="text-muted-foreground text-xs font-medium tracking-wide uppercase">Casual leave</p>
			<p class="text-foreground mt-1 text-2xl font-semibold tracking-tight tabular-nums">
				{data.profile.casual_leave}
			</p>
		</div>
		<div class="bg-muted/30 rounded-xl px-3.5 py-3">
			<p class="text-muted-foreground text-xs font-medium tracking-wide uppercase">Earned leave</p>
			<p class="text-foreground mt-1 text-2xl font-semibold tracking-tight tabular-nums">
				{data.profile.earned_leave}
			</p>
		</div>
	</section>

	<section class="border-border flex flex-col gap-4 rounded-2xl border p-3 sm:p-4 lg:p-5">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
			<div class="min-w-0">
				<p class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
					{data.isToday ? "Today's times" : 'Daily times'}
				</p>
				<h2 class="text-foreground mt-1 text-lg font-semibold tracking-tight sm:text-xl">
					{formatDayHeading(data.selectedDate)}
				</h2>
			</div>
			<div class="flex items-center gap-1.5">
				<button
					type="button"
					class="border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-10 items-center justify-center rounded-xl border transition-colors"
					aria-label="Previous day"
					onclick={() => shiftDate(-1)}
				>
					<ChevronLeft class="size-4" />
				</button>
				{#if !data.isToday}
					<Button
						type="button"
						variant="outline"
						class="h-10 rounded-xl"
						onclick={() => goToDate(data.today)}
					>
						Today
					</Button>
				{/if}
				<button
					type="button"
					class="border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-10 items-center justify-center rounded-xl border transition-colors disabled:opacity-40"
					aria-label="Next day"
					disabled={data.selectedDate >= data.today}
					onclick={() => shiftDate(1)}
				>
					<ChevronRight class="size-4" />
				</button>
			</div>
		</div>

		<!-- Week strip (Remote / Jobber) -->
		<div
			class="scroll-x-contain flex gap-1.5 pb-0.5 [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden"
		>
			{#each dayStrip as day (day.date)}
				<button
					type="button"
					class={[
						'flex min-w-11 flex-col items-center gap-1 rounded-2xl px-2 py-2 transition-colors',
						day.isSelected
							? 'bg-foreground text-background'
							: 'text-muted-foreground hover:bg-muted hover:text-foreground'
					]}
					aria-pressed={day.isSelected}
					onclick={() => goToDate(day.date)}
				>
					<span class="text-[10px] font-medium tracking-wide uppercase">{day.weekday}</span>
					<span class="text-sm font-semibold tabular-nums">{day.dayNumber}</span>
					<span
						class={[
							'size-1 rounded-full',
							day.hasLog
								? day.isSelected
									? 'bg-background'
									: 'bg-primary'
								: 'bg-transparent'
						]}
						aria-hidden="true"
					></span>
				</button>
			{/each}
		</div>

		{#if selectedHoursLabel !== '—'}
			<div class="bg-muted/30 rounded-2xl px-4 py-3">
				<p class="text-muted-foreground text-xs font-medium tracking-wide uppercase">Tracked</p>
				<p class="text-foreground mt-1 text-3xl font-semibold tracking-tight tabular-nums">
					{selectedHoursLabel}
				</p>
			</div>
		{/if}

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
			<input type="hidden" name="workDate" value={workDate} />

			<div class="flex flex-col gap-1.5 lg:max-w-xs">
				<label for="workDate" class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
					Date
				</label>
				<DateInput
					id="workDate"
					required
					max={data.today}
					value={workDate}
					class="h-11 rounded-xl"
					onchange={onDateChange}
				/>
			</div>

			<div class="grid gap-3 sm:grid-cols-2 lg:max-w-xl">
				<div class="flex flex-col gap-1.5">
					<label for="inTime" class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
						In time
					</label>
					<TimeInput id="inTime" name="inTime" value={inValue} class="h-11 rounded-xl" />
				</div>
				<div class="flex flex-col gap-1.5">
					<label for="outTime" class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
						Out time
					</label>
					<TimeInput id="outTime" name="outTime" value={outValue} class="h-11 rounded-xl" />
				</div>
			</div>

			{#if form?.times && form?.error}
				<p role="alert" class="text-destructive text-sm">{form.error}</p>
			{/if}

			<Button type="submit" class="h-11 w-full rounded-xl sm:w-auto sm:min-w-40" disabled={savingTimes}>
				{savingTimes ? 'Saving…' : 'Save times'}
			</Button>
		</form>
	</section>

	<section class="flex flex-col gap-3">
		<div class="flex items-baseline justify-between gap-3 px-0.5">
			<h2 class="text-muted-foreground text-xs font-medium tracking-wide uppercase">Recent days</h2>
			<p class="text-muted-foreground text-xs">{data.recentDays.length}</p>
		</div>

		{#if data.recentDays.length === 0}
			<div
				class="border-border bg-muted/20 text-muted-foreground rounded-2xl border border-dashed px-4 py-10 text-center text-sm"
			>
				No attendance logged yet.
			</div>
		{:else}
			<div class="border-border overflow-hidden rounded-2xl border">
				<div
					class="text-muted-foreground border-border bg-muted/30 hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_5.5rem] gap-4 border-b px-4 py-2.5 text-xs font-medium tracking-wide uppercase lg:grid"
					aria-hidden="true"
				>
					<span>Date</span>
					<span>In → Out</span>
					<span class="text-right">Hours</span>
				</div>
				<ul class="divide-border divide-y">
					{#each data.recentDays as day (day.work_date)}
						<li>
							<a
								href={`/attendance?date=${day.work_date}`}
								class={[
									'flex min-h-14 items-center justify-between gap-3 px-3.5 py-3 transition-colors lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_5.5rem] lg:gap-4 lg:px-4',
									day.work_date === data.selectedDate
										? 'bg-muted/50'
										: 'hover:bg-muted/40 active:bg-muted/60'
								]}
								aria-current={day.work_date === data.selectedDate ? 'page' : undefined}
							>
								<span class="min-w-0">
									<span class="text-foreground block font-medium">
										{formatListDate(day.work_date)}
										{#if day.work_date === data.today}
											<span class="text-muted-foreground font-normal"> · Today</span>
										{/if}
									</span>
									<span class="text-muted-foreground mt-0.5 block text-sm lg:hidden">
										{(day.in_time?.slice(0, 5) ?? '—') + ' → ' + (day.out_time?.slice(0, 5) ?? '—')}
									</span>
								</span>
								<span class="text-muted-foreground hidden text-sm tabular-nums lg:block">
									{(day.in_time?.slice(0, 5) ?? '—') + ' → ' + (day.out_time?.slice(0, 5) ?? '—')}
								</span>
								<span class="text-foreground shrink-0 text-sm font-medium tabular-nums lg:text-right">
									{day.hoursLabel}
								</span>
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</section>

	<div class="grid gap-5 lg:grid-cols-2 lg:gap-6">
		<section class="flex flex-col gap-3">
			<div class="flex items-baseline justify-between gap-3 px-0.5">
				<div>
					<h2 class="text-muted-foreground text-xs font-medium tracking-wide uppercase">Recent leave</h2>
					<p class="text-muted-foreground mt-0.5 text-xs">Your latest leave applications.</p>
				</div>
				<Button href={resolve('/(app)/attendance/leave')} variant="outline" size="sm" class="rounded-xl">
					View all
				</Button>
			</div>

			{#if data.leaveRequests.length === 0}
				<div
					class="border-border bg-muted/20 text-muted-foreground rounded-2xl border border-dashed px-4 py-8 text-center text-sm"
				>
					No leave requests yet.
				</div>
			{:else}
				<ul class="border-border divide-border overflow-hidden rounded-2xl border divide-y">
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
				<div>
					<h2 class="text-muted-foreground text-xs font-medium tracking-wide uppercase">Recent WFH</h2>
					<p class="text-muted-foreground mt-0.5 text-xs">Your latest work-from-home requests.</p>
				</div>
				<Button href={resolve('/(app)/attendance/wfh')} variant="outline" size="sm" class="rounded-xl">
					View all
				</Button>
			</div>

			{#if data.wfhRequests.length === 0}
				<div
					class="border-border bg-muted/20 text-muted-foreground rounded-2xl border border-dashed px-4 py-8 text-center text-sm"
				>
					No WFH requests yet.
				</div>
			{:else}
				<ul class="border-border divide-border overflow-hidden rounded-2xl border divide-y">
					{#each data.wfhRequests as request (request.id)}
						<li class="flex items-start justify-between gap-3 px-3.5 py-3.5">
							<div class="min-w-0">
								<p class="text-foreground text-sm font-medium">{formatListDate(request.work_date)}</p>
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
