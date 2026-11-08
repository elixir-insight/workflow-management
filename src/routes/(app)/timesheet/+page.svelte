<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Button } from '#lib/components/ui/button';
	import { Input } from '#lib/components/ui/input';
	import UserAvatar from '#lib/components/user-avatar.svelte';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Download from '@lucide/svelte/icons/download';
	import Search from '@lucide/svelte/icons/search';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let query = $state('');
	let selectedEmployeeId = $state<string | null>(null);

	const fieldClass =
		'border-input bg-background text-foreground h-10 w-full rounded-xl border px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3';

	const normalizedQuery = $derived(query.trim().toLowerCase());

	const filteredRows = $derived(
		data.rows.filter((row) => {
			if (!normalizedQuery) return true;
			return (
				row.displayName.toLowerCase().includes(normalizedQuery) ||
				row.employee.email.toLowerCase().includes(normalizedQuery) ||
				(row.employee.employee_id?.toLowerCase().includes(normalizedQuery) ?? false)
			);
		})
	);

	const selectedRow = $derived(
		filteredRows.find((row) => row.employee.id === selectedEmployeeId) ?? filteredRows[0] ?? null
	);

	$effect(() => {
		if (!selectedRow) {
			selectedEmployeeId = null;
			return;
		}
		if (selectedEmployeeId !== selectedRow.employee.id) {
			selectedEmployeeId = selectedRow.employee.id;
		}
	});

	function updateFilters(next: { verticalId?: string; month?: string }) {
		const params = new URLSearchParams(page.url.searchParams.toString());
		if (next.verticalId) params.set('verticalId', next.verticalId);
		if (next.month) params.set('month', next.month);
		goto(`?${params.toString()}`, { replace: true, reset: false });
	}

	function shiftMonth(delta: number) {
		const [yearText, monthText] = data.month.split('-');
		const date = new Date(Date.UTC(Number(yearText), Number(monthText) - 1 + delta, 1));
		const next = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
		updateFilters({ month: next });
	}

	function exportHref() {
		if (!data.selectedVertical) return '#';
		const params = new URLSearchParams({
			verticalId: data.selectedVertical.id,
			month: data.month
		});
		return `${resolve('/(app)/timesheet/export')}?${params.toString()}`;
	}

	function dayColumnClass(weekend: boolean, holiday: boolean) {
		if (holiday) return 'bg-amber-500/10';
		if (weekend) return 'bg-muted/50';
		return '';
	}

	function formatDayLabel(date: string) {
		return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-IN', {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
			timeZone: 'UTC'
		});
	}

	function clockRange(inTime: string | null, outTime: string | null) {
		if (!inTime && !outTime) return null;
		return `${inTime?.slice(0, 5) ?? '—'}–${outTime?.slice(0, 5) ?? '—'}`;
	}
</script>

<svelte:head>
	<title>Timesheet · ElixirPay</title>
</svelte:head>

<div class="flex w-full max-w-full min-w-0 flex-col gap-5 lg:gap-6">
	<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
		<div class="flex min-w-0 flex-col gap-2">
			<p class="text-muted-foreground text-sm leading-relaxed">
				In and out times for everyone in a vertical, by month.
			</p>
			<div class="flex flex-wrap items-center gap-2 text-xs">
				<span
					class="bg-primary/10 text-primary inline-flex items-center rounded-full px-2 py-0.5 font-medium"
				>
					WFH
				</span>
				<span class="text-muted-foreground">Approved WFH</span>
				<span class="bg-muted text-muted-foreground inline-flex items-center gap-1.5 rounded-full px-2 py-0.5">
					<span class="bg-muted-foreground/40 size-2 rounded-sm"></span>
					Weekend
				</span>
				<span
					class="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-800 dark:text-amber-300"
				>
					<span class="size-2 rounded-sm bg-amber-500/60"></span>
					Holiday
				</span>
				<span
					class="inline-flex items-center rounded-full bg-rose-500/10 px-2 py-0.5 font-medium text-rose-700 dark:text-rose-300"
				>
					LOP
				</span>
			</div>
		</div>

		<div class="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
			{#if data.canManageHolidays}
				<Button
					href={resolve('/(app)/admin/holidays')}
					variant="outline"
					class="h-11 w-full rounded-xl sm:h-10 sm:w-auto"
				>
					Office holidays
				</Button>
			{/if}
			{#if data.selectedVertical}
				<Button href={exportHref()} variant="outline" class="h-11 w-full rounded-xl sm:h-10 sm:w-auto">
					<Download class="size-4" />
					Export CSV
				</Button>
			{/if}
		</div>
	</div>

	{#if data.verticals.length === 0}
		<div
			class="border-border bg-muted/20 text-muted-foreground rounded-2xl border border-dashed px-4 py-10 text-center text-sm"
		>
			No verticals yet. Add one in User management.
		</div>
	{:else}
		<section
			class="border-border flex flex-col gap-3 rounded-2xl border p-3 sm:p-4 lg:flex-row lg:items-end lg:gap-4"
		>
			<div class="grid flex-1 gap-3 sm:grid-cols-2 lg:max-w-xl">
				<div class="flex flex-col gap-1.5">
					<label for="verticalId" class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
						Vertical
					</label>
					<select
						id="verticalId"
						class={fieldClass}
						value={data.selectedVertical?.id ?? ''}
						onchange={(event) =>
							updateFilters({ verticalId: (event.currentTarget as HTMLSelectElement).value })}
					>
						{#each data.verticals as vertical (vertical.id)}
							<option value={vertical.id}>{vertical.name}</option>
						{/each}
					</select>
				</div>
				<div class="flex flex-col gap-1.5">
					<label for="month" class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
						Month
					</label>
					<div class="flex items-center gap-1.5">
						<button
							type="button"
							class="border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-10 shrink-0 items-center justify-center rounded-xl border transition-colors"
							aria-label="Previous month"
							onclick={() => shiftMonth(-1)}
						>
							<ChevronLeft class="size-4" />
						</button>
						<Input
							id="month"
							type="month"
							value={data.month}
							class="h-10 rounded-xl"
							onchange={(event) =>
								updateFilters({ month: (event.currentTarget as HTMLInputElement).value })}
						/>
						<button
							type="button"
							class="border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-10 shrink-0 items-center justify-center rounded-xl border transition-colors"
							aria-label="Next month"
							onclick={() => shiftMonth(1)}
						>
							<ChevronRight class="size-4" />
						</button>
					</div>
				</div>
			</div>

			<label class="relative block w-full lg:ml-auto lg:max-w-xs">
				<span class="sr-only">Search employees</span>
				<Search
					class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
					aria-hidden="true"
				/>
				<Input
					type="search"
					bind:value={query}
					placeholder="Search people"
					class="bg-muted/40 h-10 rounded-xl border-transparent pr-3 pl-10 shadow-none"
				/>
			</label>
		</section>
	{/if}

	{#if data.holidays.length > 0}
		<div class="flex flex-col gap-2 px-0.5">
			<p class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
				Office holidays this month
			</p>
			<ul class="flex flex-wrap gap-2">
				{#each data.holidays as holiday (holiday.holiday_date)}
					<li
						class="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs text-amber-900 dark:text-amber-200"
					>
						<span class="font-medium">{holiday.holiday_date.slice(8)}</span>
						<span class="opacity-80">{holiday.name.trim() || 'Holiday'}</span>
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	{#if data.selectedVertical}
		<div class="flex items-baseline justify-between gap-3 px-0.5">
			<div class="min-w-0">
				<h2 class="text-foreground text-lg font-semibold tracking-tight lg:text-xl">
					{data.selectedVertical.name}
				</h2>
				<p class="text-muted-foreground text-sm">
					{data.monthLabel} · {data.employeeCount} employee{data.employeeCount === 1 ? '' : 's'}
				</p>
			</div>
			{#if normalizedQuery}
				<p class="text-muted-foreground shrink-0 text-xs">
					{filteredRows.length} match{filteredRows.length === 1 ? '' : 'es'}
				</p>
			{/if}
		</div>

		{#if data.rows.length === 0}
			<div
				class="border-border bg-muted/20 text-muted-foreground rounded-2xl border border-dashed px-4 py-12 text-center text-sm"
			>
				No approved employees in this vertical.
			</div>
		{:else if filteredRows.length === 0}
			<div
				class="border-border bg-muted/20 text-muted-foreground rounded-2xl border border-dashed px-4 py-12 text-center text-sm"
			>
				No people match “{query.trim()}”.
			</div>
		{:else}
			<!-- Mobile: person list + day agenda (Jobber / Remote) -->
			<div class="flex flex-col gap-4 lg:hidden">
				<div class="border-border overflow-hidden rounded-2xl border">
					<ul class="divide-border divide-y">
						{#each filteredRows as row (row.employee.id)}
							<li>
								<button
									type="button"
									class={[
										'flex w-full min-h-14 items-center gap-3 px-3.5 py-3 text-left transition-colors',
										selectedRow?.employee.id === row.employee.id
											? 'bg-muted/60'
											: 'hover:bg-muted/40 active:bg-muted/50'
									]}
									aria-pressed={selectedRow?.employee.id === row.employee.id}
									onclick={() => (selectedEmployeeId = row.employee.id)}
								>
									<UserAvatar
										firstName={row.employee.first_name}
										lastName={row.employee.last_name}
										email={row.employee.email}
										size="sm"
										class="size-10 shrink-0 text-sm"
									/>
									<span class="min-w-0 flex-1">
										<span class="text-foreground block truncate font-medium">{row.displayName}</span>
										<span class="text-muted-foreground block truncate text-xs">
											{row.employee.employee_id ?? row.employee.email}
										</span>
									</span>
								</button>
							</li>
						{/each}
					</ul>
				</div>

				{#if selectedRow}
					<section class="flex flex-col gap-2">
						<div class="flex items-baseline justify-between gap-3 px-0.5">
							<h3 class="text-foreground font-medium">{selectedRow.displayName}</h3>
							<p class="text-muted-foreground text-xs">{data.monthLabel}</p>
						</div>
						<ul class="border-border divide-border overflow-hidden rounded-2xl border divide-y">
							{#each selectedRow.cells as cell, index (data.dayMeta[index].date)}
								{@const day = data.dayMeta[index]}
								{@const range = clockRange(cell.inTime, cell.outTime)}
								<li
									class="flex items-start justify-between gap-3 px-3.5 py-3 {dayColumnClass(
										day.weekend,
										day.holiday
									)}"
								>
									<div class="min-w-0">
										<p class="text-foreground text-sm font-medium">{formatDayLabel(day.date)}</p>
										{#if day.holiday}
											<p class="text-amber-800 dark:text-amber-300 mt-0.5 text-xs">
												{day.holidayName || 'Office holiday'}
											</p>
										{:else if day.weekend}
											<p class="text-muted-foreground mt-0.5 text-xs">Weekend</p>
										{/if}
										{#if cell.wfh || cell.lop}
											<div class="mt-1.5 flex flex-wrap gap-1.5">
												{#if cell.wfh}
													<span
														class="bg-primary/10 text-primary inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium"
													>
														WFH
													</span>
												{/if}
												{#if cell.lop}
													<span
														class="inline-flex rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-700 dark:text-rose-300"
													>
														LOP
													</span>
												{/if}
											</div>
										{/if}
									</div>
									<p class="text-muted-foreground shrink-0 text-sm tabular-nums">
										{range ?? '—'}
									</p>
								</li>
							{/each}
						</ul>
					</section>
				{/if}
			</div>

			<!-- Desktop: month matrix with sticky employee (ClickUp / Deputy / 7shifts) -->
			<div class="border-border hidden overflow-hidden rounded-2xl border lg:block">
				<div class="scroll-x-contain rounded-b-2xl">
					<table class="min-w-full border-collapse text-left text-sm">
						<thead class="bg-muted/40">
							<tr>
								<th
									class="border-border text-foreground sticky left-0 z-20 border-b bg-muted/40 px-4 py-2.5 font-medium shadow-[4px_0_8px_-4px_rgba(0,0,0,0.12)]"
								>
									Employee
								</th>
								<th class="border-border text-muted-foreground border-b px-3 py-2.5 font-medium">
									ID
								</th>
								{#each data.dayMeta as day (day.date)}
									<th
										class="border-border text-muted-foreground border-b px-1.5 py-2 text-center font-medium {dayColumnClass(
											day.weekend,
											day.holiday
										)}"
										title={day.holiday
											? day.holidayName || 'Office holiday'
											: day.weekend
												? 'Weekend'
												: undefined}
									>
										<div class="flex min-w-14 flex-col items-center gap-0.5">
											<span class="text-foreground text-xs">{day.dayNumber}</span>
											<span class="text-[10px] font-normal tracking-wide uppercase">
												{day.weekday}
											</span>
										</div>
									</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each filteredRows as row (row.employee.id)}
								<tr class="group hover:bg-muted/20">
									<td
										class="border-border text-foreground sticky left-0 z-10 border-b bg-background px-4 py-2.5 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.12)] group-hover:bg-muted/20"
									>
										<div class="flex min-w-48 items-center gap-2.5">
											<UserAvatar
												firstName={row.employee.first_name}
												lastName={row.employee.last_name}
												email={row.employee.email}
												size="sm"
												class="size-8 shrink-0 text-xs"
											/>
											<div class="min-w-0">
												<p class="truncate font-medium">{row.displayName}</p>
												<p class="text-muted-foreground truncate text-xs">{row.employee.email}</p>
											</div>
										</div>
									</td>
									<td
										class="border-border text-muted-foreground border-b px-3 py-2.5 whitespace-nowrap"
									>
										{row.employee.employee_id ?? '—'}
									</td>
									{#each row.cells as cell, index (data.dayMeta[index].date)}
										{@const day = data.dayMeta[index]}
										{@const range = clockRange(cell.inTime, cell.outTime)}
										<td
											class="border-border border-b px-1.5 py-2 text-center align-middle {dayColumnClass(
												day.weekend,
												day.holiday
											)}"
											title={cell.label ||
												(day.holiday
													? day.holidayName || 'Office holiday'
													: day.weekend
														? 'Weekend'
														: 'No times')}
										>
											<div class="flex min-w-14 flex-col items-center gap-0.5">
												{#if cell.wfh}
													<span
														class="bg-primary/10 text-primary inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-medium tracking-wide"
													>
														WFH
													</span>
												{/if}
												{#if cell.lop}
													<span
														class="inline-flex rounded-full bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-medium tracking-wide text-rose-700 dark:text-rose-300"
													>
														LOP
													</span>
												{/if}
												<span class="text-muted-foreground text-[11px] whitespace-nowrap tabular-nums">
													{range ?? (!cell.wfh && !cell.lop ? '—' : '')}
												</span>
											</div>
										</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	{/if}
</div>
