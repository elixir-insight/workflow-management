<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import RequestStatusBadge from '#lib/components/attendance/request-status-badge.svelte';
	import { Button } from '#lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader } from '#lib/components/ui/card';
	import { Input } from '#lib/components/ui/input';
	import { Label } from '#lib/components/ui/label';
	import { profileDisplayName } from '#lib/profile/display';
	import Copy from '@lucide/svelte/icons/copy';
	import { toast } from 'svelte-sonner';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let saving = $state(false);
	let copied = $state(false);

	const managerLabel = $derived(
		data.manager
			? profileDisplayName(data.manager)
			: 'Reporting Lead (placeholder — no manager mapped)'
	);

	const fieldClass =
		'border-input bg-background text-foreground h-11 w-full rounded-lg border px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 md:text-sm';

	async function copyEmail(body: string) {
		try {
			await navigator.clipboard.writeText(body);
			copied = true;
			toast.success('Leave mail copied to clipboard.');
			setTimeout(() => (copied = false), 2000);
		} catch {
			toast.error('Could not copy. Select the text and copy manually.');
		}
	}
</script>

<svelte:head>
	<title>Apply leave · ElixirPay</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<nav class="text-muted-foreground text-sm">
		<a href={resolve('/(app)/attendance')} class="text-foreground underline">Attendance</a>
		<span aria-hidden="true"> / </span>
		<span class="text-foreground">Leave</span>
	</nav>

	{#if data.created}
		<Card>
			<CardHeader>
				{#if data.manager}
					<h2 class="text-foreground text-lg font-medium">Mail draft ready</h2>
					<CardDescription>
						Leave is pending approval from {managerLabel}
						{#if data.manager.email}
							({data.manager.email})
						{/if}. Copy this and send it to them.
					</CardDescription>
				{:else}
					<h2 class="text-foreground text-lg font-medium">Leave recorded</h2>
					<CardDescription>
						No reporting lead is mapped, so this leave was approved immediately and deducted from
						your balance.
					</CardDescription>
				{/if}
			</CardHeader>
			{#if data.manager && data.created.email_body}
				<CardContent class="flex flex-col gap-3">
					<pre
						class="border-border bg-muted/40 text-foreground max-h-80 overflow-auto rounded-lg border p-3 text-sm whitespace-pre-wrap"
					>{data.created.email_body}</pre>
					<Button
						type="button"
						class="h-10 w-full sm:w-auto"
						onclick={() => copyEmail(data.created?.email_body ?? '')}
					>
						<Copy class="size-4" />
						{copied ? 'Copied' : 'Copy mail text'}
					</Button>
				</CardContent>
			{/if}
		</Card>
	{/if}

	<div class="grid gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
		<Card>
			<CardHeader>
				<h2 class="text-foreground text-lg font-medium">Apply for leave</h2>
				<CardDescription>
					Balances — casual {data.me.casual_leave}, earned {data.me.earned_leave}.
					{#if data.manager}
						Needs approval from {managerLabel}.
					{:else}
						No reporting lead mapped — leave is recorded immediately.
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
						<Label for="leaveKind">Leave type</Label>
						<select
							id="leaveKind"
							name="leaveKind"
							required
							class={fieldClass}
							value={form?.leaveKind ?? 'casual'}
						>
							<option value="casual">Casual</option>
							<option value="earned">Earned</option>
						</select>
					</div>

					<div class="grid grid-cols-2 gap-3">
						<div class="flex flex-col gap-2">
							<Label for="startDate">From</Label>
							<Input
								id="startDate"
								name="startDate"
								type="date"
								required
								value={form?.startDate ?? ''}
								class="h-11"
							/>
						</div>
						<div class="flex flex-col gap-2">
							<Label for="endDate">To</Label>
							<Input
								id="endDate"
								name="endDate"
								type="date"
								required
								value={form?.endDate ?? ''}
								class="h-11"
							/>
						</div>
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

					<p class="text-muted-foreground text-xs">
						{#if data.manager}
							Reporting lead: {managerLabel}
							{#if data.manager.email}
								· {data.manager.email}
							{/if}
						{:else}
							No reporting lead — approval is not required.
						{/if}
					</p>

					{#if form?.error}
						<p role="alert" class="text-destructive text-sm">{form.error}</p>
					{/if}

					<Button type="submit" class="h-11 w-full" disabled={saving}>
						{saving
							? 'Submitting…'
							: data.manager
								? 'Submit for approval'
								: 'Record leave'}
					</Button>
				</form>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<h2 class="text-foreground text-lg font-medium">Your leave requests</h2>
				<CardDescription>History and approval status.</CardDescription>
			</CardHeader>
			<CardContent>
				{#if data.requests.length === 0}
					<p class="text-muted-foreground text-sm">No leave requests yet.</p>
				{:else}
					<ul class="flex flex-col gap-3">
						{#each data.requests as request (request.id)}
							<li class="border-border rounded-lg border p-3">
								<div class="flex items-start justify-between gap-3">
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
										<p class="text-muted-foreground mt-1 text-sm">{request.reason}</p>
									</div>
									<RequestStatusBadge status={request.status} />
								</div>
								{#if request.email_body}
									<div class="mt-3 flex flex-wrap gap-2">
										<Button
											type="button"
											variant="outline"
											size="sm"
											onclick={() => copyEmail(request.email_body)}
										>
											<Copy class="size-3.5" />
											Copy mail
										</Button>
									</div>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</CardContent>
		</Card>
	</div>
</div>
