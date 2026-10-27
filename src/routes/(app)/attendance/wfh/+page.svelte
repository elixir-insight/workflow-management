<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import RequestStatusBadge from '#lib/components/attendance/request-status-badge.svelte';
	import { Button } from '#lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader } from '#lib/components/ui/card';
	import { Input } from '#lib/components/ui/input';
	import { Label } from '#lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let saving = $state(false);
</script>

<svelte:head>
	<title>WFH request · ElixirPay</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<nav class="text-muted-foreground text-sm">
		<a href={resolve('/(app)/attendance')} class="text-foreground underline">Attendance</a>
		<span aria-hidden="true"> / </span>
		<span class="text-foreground">WFH</span>
	</nav>

	<div class="grid gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
		<Card>
			<CardHeader>
				<h2 class="text-foreground text-lg font-medium">Request WFH</h2>
				<CardDescription>
					{#if data.hasManager}
						Needs approval from {data.managerEmail ?? 'your reporting lead'}.
					{:else}
						No reporting lead mapped — this is captured immediately.
					{/if}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					method="POST"
					action="?/apply"
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
					<div class="flex flex-col gap-2">
						<Label for="workDate">Date</Label>
						<Input
							id="workDate"
							name="workDate"
							type="date"
							required
							value={form?.workDate ?? ''}
							class="h-11"
						/>
					</div>

					<div class="flex flex-col gap-2">
						<Label for="reason">Reason</Label>
						<textarea
							id="reason"
							name="reason"
							required
							rows="4"
							class="border-input bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border px-2.5 py-2 text-base outline-none focus-visible:ring-3 md:text-sm"
						>{form?.reason ?? ''}</textarea>
					</div>

					{#if form?.error}
						<p role="alert" class="text-destructive text-sm">{form.error}</p>
					{/if}

					<Button type="submit" class="h-11 w-full" disabled={saving}>
						{saving ? 'Submitting…' : 'Submit WFH'}
					</Button>
				</form>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<h2 class="text-foreground text-lg font-medium">Your WFH requests</h2>
				<CardDescription>History and approval status.</CardDescription>
			</CardHeader>
			<CardContent>
				{#if data.requests.length === 0}
					<p class="text-muted-foreground text-sm">No WFH requests yet.</p>
				{:else}
					<ul class="flex flex-col gap-3">
						{#each data.requests as request (request.id)}
							<li class="border-border flex items-start justify-between gap-3 rounded-lg border p-3">
								<div class="min-w-0">
									<p class="text-foreground text-sm font-medium">{request.work_date}</p>
									<p class="text-muted-foreground text-sm">{request.reason}</p>
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
