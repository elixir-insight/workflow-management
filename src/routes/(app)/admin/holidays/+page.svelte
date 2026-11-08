<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Button } from '#lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader } from '#lib/components/ui/card';
	import DateInput from '#lib/components/ui/date-input.svelte';
	import { Input } from '#lib/components/ui/input';
	import { Label } from '#lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let saving = $state(false);
	let removingId = $state<string | null>(null);
</script>

<svelte:head>
	<title>Office holidays · ElixirPay</title>
</svelte:head>

<div class="flex w-full max-w-full min-w-0 flex-col gap-6">
	<p class="text-muted-foreground text-sm">
		Mark company-wide office holidays. They appear as differentiated columns on the timesheet.
		People can still log times on those dates.
	</p>

	<div class="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
		<Card>
			<CardHeader>
				<h2 class="text-foreground text-lg font-medium">Add office holiday</h2>
				<CardDescription>Pick a date and optional label.</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					method="POST"
					action="?/add"
					class="flex flex-col gap-4"
					use:enhance={() => {
						saving = true;
						return async ({ result, update }) => {
							try {
								await update();
								if (result.type === 'failure' && typeof result.data?.error === 'string') {
									toast.error(result.data.error);
								}
							} finally {
								saving = false;
							}
						};
					}}
				>
					<div class="flex min-w-0 flex-col gap-2">
						<Label for="holidayDate">Date</Label>
						<DateInput
							id="holidayDate"
							name="holidayDate"
							required
							value={form?.holidayDate ?? ''}
							class="h-11 rounded-xl"
						/>
					</div>

					<div class="flex flex-col gap-2">
						<Label for="name">Name</Label>
						<Input
							id="name"
							name="name"
							placeholder="e.g. Diwali"
							value={form?.name ?? ''}
							class="h-11"
						/>
					</div>

					{#if form?.error}
						<p role="alert" class="text-destructive text-sm">{form.error}</p>
					{/if}

					<Button type="submit" class="h-11 w-full" disabled={saving}>
						{saving ? 'Saving…' : 'Add holiday'}
					</Button>
				</form>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex-row items-center justify-between gap-3 space-y-0">
				<div>
					<h2 class="text-foreground text-lg font-medium">Scheduled holidays</h2>
					<CardDescription>Newest first.</CardDescription>
				</div>
				<Button href={resolve('/(app)/timesheet')} variant="outline" size="sm">
					Open timesheet
				</Button>
			</CardHeader>
			<CardContent>
				{#if data.holidays.length === 0}
					<p class="text-muted-foreground text-sm">No office holidays yet.</p>
				{:else}
					<ul class="flex flex-col gap-3">
						{#each data.holidays as holiday (holiday.id)}
							<li
								class="border-border flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
							>
								<div class="min-w-0">
									<p class="text-foreground text-sm font-medium">{holiday.holiday_date}</p>
									<p class="text-muted-foreground text-sm">
										{holiday.name.trim() || 'Holiday'}
									</p>
								</div>
								<form
									method="POST"
									action="?/remove"
									use:enhance={() => {
										removingId = holiday.id;
										return async ({ result, update }) => {
											try {
												await update();
												if (result.type === 'failure' && typeof result.data?.error === 'string') {
													toast.error(result.data.error);
												}
											} finally {
												removingId = null;
											}
										};
									}}
								>
									<input type="hidden" name="id" value={holiday.id} />
									<Button
										type="submit"
										variant="outline"
										size="sm"
										disabled={removingId === holiday.id}
									>
										{removingId === holiday.id ? 'Removing…' : 'Remove'}
									</Button>
								</form>
							</li>
						{/each}
					</ul>
				{/if}
			</CardContent>
		</Card>
	</div>
</div>
