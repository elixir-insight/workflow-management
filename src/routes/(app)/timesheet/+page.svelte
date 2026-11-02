<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Button } from '#lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader } from '#lib/components/ui/card';
	import { Input } from '#lib/components/ui/input';
	import { Label } from '#lib/components/ui/label';
	import Download from '@lucide/svelte/icons/download';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const fieldClass =
		'border-input bg-background text-foreground h-11 w-full rounded-lg border px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 md:text-sm';

	function updateFilters(next: { verticalId?: string; month?: string }) {
		const params = new URLSearchParams(page.url.searchParams.toString());
		if (next.verticalId) params.set('verticalId', next.verticalId);
		if (next.month) params.set('month', next.month);
		goto(`?${params.toString()}`, { replace: true, reset: false });
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
		if (weekend) return 'bg-muted/60';
		return '';
	}
</script>

<svelte:head>
	<title>Timesheet · ElixirPay</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<div class="flex flex-wrap items-end justify-between gap-4">
		<div>
			<p class="text-muted-foreground text-sm">
				In and out times for everyone in a vertical, by month.
			</p>
			<div class="text-muted-foreground mt-2 flex flex-wrap items-center gap-3 text-xs">
				<span class="inline-flex items-center gap-1.5">
					<span
						class="bg-primary/10 text-primary inline-flex items-center rounded-full px-2 py-0.5 font-medium"
					>
						WFH
					</span>
					Approved WFH
				</span>
				<span class="inline-flex items-center gap-1.5">
					<span class="bg-muted inline-block size-3 rounded-sm border"></span>
					Weekend
				</span>
				<span class="inline-flex items-center gap-1.5">
					<span class="inline-block size-3 rounded-sm bg-amber-500/30"></span>
					Office holiday
				</span>
			</div>
		</div>

		<div class="flex flex-wrap gap-2">
			{#if data.canManageHolidays}
				<Button href={resolve('/(app)/admin/holidays')} variant="outline" class="h-10">
					Office holidays
				</Button>
			{/if}
			{#if data.selectedVertical}
				<Button href={exportHref()} variant="outline" class="h-10">
					<Download class="size-4" />
					Export CSV
				</Button>
			{/if}
		</div>
	</div>

	<Card>
		<CardHeader>
			<h2 class="text-foreground text-base font-medium">Filters</h2>
			<CardDescription>Choose a vertical and month to load the timesheet.</CardDescription>
		</CardHeader>
		<CardContent>
			{#if data.verticals.length === 0}
				<p class="text-muted-foreground text-sm">No verticals yet. Add one in User management.</p>
			{:else}
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="flex flex-col gap-2">
						<Label for="verticalId">Vertical</Label>
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
					<div class="flex flex-col gap-2">
						<Label for="month">Month</Label>
						<Input
							id="month"
							type="month"
							value={data.month}
							class="h-11"
							onchange={(event) =>
								updateFilters({ month: (event.currentTarget as HTMLInputElement).value })}
						/>
					</div>
				</div>
			{/if}
		</CardContent>
	</Card>

	{#if data.holidays.length > 0}
		<Card>
			<CardHeader>
				<h2 class="text-foreground text-base font-medium">Office holidays this month</h2>
				<CardDescription>Marked on the grid below.</CardDescription>
			</CardHeader>
			<CardContent>
				<ul class="flex flex-col gap-2">
					{#each data.holidays as holiday (holiday.holiday_date)}
						<li class="text-sm">
							<span class="text-foreground font-medium">{holiday.holiday_date}</span>
							<span class="text-muted-foreground">
								· {holiday.name.trim() || 'Holiday'}
							</span>
						</li>
					{/each}
				</ul>
			</CardContent>
		</Card>
	{/if}

	{#if data.selectedVertical}
		<Card>
			<CardHeader class="flex-row items-center justify-between gap-3 space-y-0">
				<div>
					<h2 class="text-foreground text-lg font-medium">{data.selectedVertical.name}</h2>
					<CardDescription>
						{data.monthLabel} · {data.employeeCount} employee{data.employeeCount === 1 ? '' : 's'}
					</CardDescription>
				</div>
			</CardHeader>
			<CardContent>
				{#if data.rows.length === 0}
					<p class="text-muted-foreground text-sm">No approved employees in this vertical.</p>
				{:else}
					<div class="border-border overflow-x-auto rounded-lg border">
						<table class="min-w-full border-collapse text-left text-sm">
							<thead class="bg-muted/40">
								<tr>
									<th
										class="border-border text-foreground sticky left-0 z-10 border-b bg-muted/40 px-3 py-2 font-medium"
									>
										Employee
									</th>
									<th class="border-border text-muted-foreground border-b px-3 py-2 font-medium">
										ID
									</th>
									{#each data.dayMeta as day (day.date)}
										<th
											class="border-border text-muted-foreground border-b px-2 py-2 text-center font-medium {dayColumnClass(
												day.weekend,
												day.holiday
											)}"
											title={day.holiday
												? day.holidayName || 'Office holiday'
												: day.weekend
													? 'Weekend'
													: undefined}
										>
											<div class="flex flex-col items-center gap-0.5">
												<span>{day.dayNumber}</span>
												<span class="text-[10px] font-normal tracking-wide uppercase">
													{day.weekday}
												</span>
												{#if day.holiday}
													<span class="text-amber-700 dark:text-amber-400 text-[9px] font-medium">
														H
													</span>
												{:else if day.weekend}
													<span class="text-[9px] font-medium opacity-70">W</span>
												{/if}
											</div>
										</th>
									{/each}
								</tr>
							</thead>
							<tbody>
								{#each data.rows as row (row.employee.id)}
									<tr class="hover:bg-muted/20">
										<td
											class="border-border text-foreground sticky left-0 z-10 border-b bg-card px-3 py-2"
										>
											<div class="min-w-40">
												<p class="font-medium">{row.displayName}</p>
												<p class="text-muted-foreground text-xs">{row.employee.email}</p>
											</div>
										</td>
										<td
											class="border-border text-muted-foreground border-b px-3 py-2 whitespace-nowrap"
										>
											{row.employee.employee_id ?? '—'}
										</td>
										{#each row.cells as cell, index (data.dayMeta[index].date)}
											{@const day = data.dayMeta[index]}
											<td
												class="border-border border-b px-2 py-2 text-center align-middle {dayColumnClass(
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
												<div class="flex min-w-16 flex-col items-center gap-1">
													{#if cell.wfh}
														<span
															class="bg-primary/10 text-primary inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium tracking-wide"
														>
															WFH
														</span>
													{/if}
													{#if cell.lop}
														<span
															class="inline-flex rounded-full bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-rose-700 dark:text-rose-300"
														>
															LOP
														</span>
													{/if}
													<span class="text-muted-foreground text-xs whitespace-nowrap">
														{#if cell.inTime || cell.outTime}
															{cell.inTime?.slice(0, 5) ?? '—'}–{cell.outTime?.slice(0, 5) ?? '—'}
														{:else if !cell.wfh && !cell.lop}
															—
														{/if}
													</span>
												</div>
											</td>
										{/each}
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</CardContent>
		</Card>
	{/if}
</div>
