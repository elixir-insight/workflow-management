<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import RequestStatusBadge from '#lib/components/attendance/request-status-badge.svelte';
	import { Button } from '#lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader } from '#lib/components/ui/card';
	import { toast } from 'svelte-sonner';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let busyId = $state<string | null>(null);

	const hasPending = $derived(data.pendingLeave.length > 0 || data.pendingWfh.length > 0);
	const hasHistory = $derived(data.decidedLeave.length > 0 || data.decidedWfh.length > 0);

	function enhanceAction(id: string) {
		return () => {
			busyId = id;
			return async ({ result, update }: { result: { type: string; data?: { error?: unknown } }; update: () => Promise<void> }) => {
				try {
					await update();
					if (result.type === 'failure' && typeof result.data?.error === 'string') {
						toast.error(result.data.error);
					}
				} finally {
					busyId = null;
				}
			};
		};
	}
</script>

<svelte:head>
	<title>Approvals · ElixirPay</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<nav class="text-muted-foreground text-sm">
		<a href={resolve('/(app)/attendance')} class="text-foreground underline">Attendance</a>
		<span aria-hidden="true"> / </span>
		<span class="text-foreground">Approvals</span>
	</nav>

	{#if form?.error}
		<p role="alert" class="text-destructive text-sm">{form.error}</p>
	{/if}

	<p class="text-muted-foreground text-sm">
		Approve leave and WFH for people who report to you. Past decisions stay here so you can change
		or delete them if needed.
	</p>

	{#if !data.isManager && !hasPending && !hasHistory}
		<Card>
			<CardHeader>
				<h2 class="text-foreground text-lg font-medium">No approvals needed</h2>
				<CardDescription>
					You don’t currently have direct reports with leave or WFH requests.
				</CardDescription>
			</CardHeader>
		</Card>
	{:else}
		<section class="flex flex-col gap-4">
			<div>
				<h2 class="text-foreground text-base font-medium">Pending</h2>
				<p class="text-muted-foreground text-sm">Waiting for your decision.</p>
			</div>

			<div class="grid gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<h3 class="text-foreground text-base font-medium">Leave</h3>
						<CardDescription>Pending leave from your reports.</CardDescription>
					</CardHeader>
					<CardContent>
						{#if data.pendingLeave.length === 0}
							<p class="text-muted-foreground text-sm">No pending leave requests.</p>
						{:else}
							<ul class="flex flex-col gap-3">
								{#each data.pendingLeave as request (request.id)}
									<li class="border-border rounded-lg border p-3">
										<p class="text-foreground text-sm font-medium">{request.name}</p>
										<p class="text-muted-foreground text-xs">
											{request.email}
											{#if request.employeeId}
												· ID {request.employeeId}
											{/if}
										</p>
										<p class="text-foreground mt-2 text-sm capitalize">
											{request.leave_kind === 'lop' ? 'LOP' : request.leave_kind} ·
											{request.day_count} day{request.day_count === 1 ? '' : 's'}
										</p>
										<p class="text-muted-foreground text-xs">
											{request.start_date}
											{#if request.end_date !== request.start_date}
												→ {request.end_date}
											{/if}
										</p>
										<p class="text-muted-foreground mt-1 text-sm">{request.reason}</p>
										<div class="mt-3 flex flex-wrap gap-2">
											<form method="POST" action="?/decideLeave" use:enhance={enhanceAction(request.id)}>
												<input type="hidden" name="id" value={request.id} />
												<input type="hidden" name="decision" value="approved" />
												<Button type="submit" size="sm" disabled={busyId === request.id}>
													Approve
												</Button>
											</form>
											<form method="POST" action="?/decideLeave" use:enhance={enhanceAction(request.id)}>
												<input type="hidden" name="id" value={request.id} />
												<input type="hidden" name="decision" value="rejected" />
												<Button
													type="submit"
													size="sm"
													variant="outline"
													disabled={busyId === request.id}
												>
													Reject
												</Button>
											</form>
											<form method="POST" action="?/deleteLeave" use:enhance={enhanceAction(request.id)}>
												<input type="hidden" name="id" value={request.id} />
												<Button
													type="submit"
													size="sm"
													variant="outline"
													disabled={busyId === request.id}
												>
													Delete
												</Button>
											</form>
										</div>
									</li>
								{/each}
							</ul>
						{/if}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<h3 class="text-foreground text-base font-medium">WFH</h3>
						<CardDescription>Pending WFH from your reports.</CardDescription>
					</CardHeader>
					<CardContent>
						{#if data.pendingWfh.length === 0}
							<p class="text-muted-foreground text-sm">No pending WFH requests.</p>
						{:else}
							<ul class="flex flex-col gap-3">
								{#each data.pendingWfh as request (request.id)}
									<li class="border-border rounded-lg border p-3">
										<p class="text-foreground text-sm font-medium">{request.name}</p>
										<p class="text-muted-foreground text-xs">
											{request.email}
											{#if request.employeeId}
												· ID {request.employeeId}
											{/if}
										</p>
										<p class="text-foreground mt-2 text-sm">{request.work_date}</p>
										<p class="text-muted-foreground mt-1 text-sm">{request.reason}</p>
										<div class="mt-3 flex flex-wrap gap-2">
											<form method="POST" action="?/decideWfh" use:enhance={enhanceAction(request.id)}>
												<input type="hidden" name="id" value={request.id} />
												<input type="hidden" name="decision" value="approved" />
												<Button type="submit" size="sm" disabled={busyId === request.id}>
													Approve
												</Button>
											</form>
											<form method="POST" action="?/decideWfh" use:enhance={enhanceAction(request.id)}>
												<input type="hidden" name="id" value={request.id} />
												<input type="hidden" name="decision" value="rejected" />
												<Button
													type="submit"
													size="sm"
													variant="outline"
													disabled={busyId === request.id}
												>
													Reject
												</Button>
											</form>
											<form method="POST" action="?/deleteWfh" use:enhance={enhanceAction(request.id)}>
												<input type="hidden" name="id" value={request.id} />
												<Button
													type="submit"
													size="sm"
													variant="outline"
													disabled={busyId === request.id}
												>
													Delete
												</Button>
											</form>
										</div>
									</li>
								{/each}
							</ul>
						{/if}
					</CardContent>
				</Card>
			</div>
		</section>

		<section class="flex flex-col gap-4">
			<div>
				<h2 class="text-foreground text-base font-medium">Decision history</h2>
				<p class="text-muted-foreground text-sm">
					Approved or rejected requests. Change the outcome or delete if needed.
				</p>
			</div>

			{#if !hasHistory}
				<Card>
					<CardContent class="pt-6">
						<p class="text-muted-foreground text-sm">No past decisions yet.</p>
					</CardContent>
				</Card>
			{:else}
				<div class="grid gap-6 lg:grid-cols-2">
					<Card>
						<CardHeader>
							<h3 class="text-foreground text-base font-medium">Leave history</h3>
							<CardDescription>Leave you have already decided.</CardDescription>
						</CardHeader>
						<CardContent>
							{#if data.decidedLeave.length === 0}
								<p class="text-muted-foreground text-sm">No decided leave yet.</p>
							{:else}
								<ul class="flex flex-col gap-3">
									{#each data.decidedLeave as request (request.id)}
										<li class="border-border rounded-lg border p-3">
											<div class="flex items-start justify-between gap-3">
												<div class="min-w-0">
													<p class="text-foreground text-sm font-medium">{request.name}</p>
													<p class="text-muted-foreground text-xs">
														{request.email}
														{#if request.employeeId}
															· ID {request.employeeId}
														{/if}
													</p>
												</div>
												<RequestStatusBadge status={request.status} />
											</div>
											<p class="text-foreground mt-2 text-sm capitalize">
												{request.leave_kind === 'lop' ? 'LOP' : request.leave_kind} ·
												{request.day_count} day{request.day_count === 1 ? '' : 's'}
											</p>
											<p class="text-muted-foreground text-xs">
												{request.start_date}
												{#if request.end_date !== request.start_date}
													→ {request.end_date}
												{/if}
											</p>
											<p class="text-muted-foreground mt-1 text-sm">{request.reason}</p>
											{#if request.decided_at}
												<p class="text-muted-foreground mt-1 text-xs">
													Decided {new Date(request.decided_at).toLocaleString('en-IN')}
												</p>
											{/if}
											<div class="mt-3 flex flex-wrap gap-2">
												{#if request.status !== 'approved'}
													<form
														method="POST"
														action="?/reviseLeave"
														use:enhance={enhanceAction(request.id)}
													>
														<input type="hidden" name="id" value={request.id} />
														<input type="hidden" name="decision" value="approved" />
														<Button type="submit" size="sm" disabled={busyId === request.id}>
															Change to approved
														</Button>
													</form>
												{/if}
												{#if request.status !== 'rejected'}
													<form
														method="POST"
														action="?/reviseLeave"
														use:enhance={enhanceAction(request.id)}
													>
														<input type="hidden" name="id" value={request.id} />
														<input type="hidden" name="decision" value="rejected" />
														<Button
															type="submit"
															size="sm"
															variant="outline"
															disabled={busyId === request.id}
														>
															Change to rejected
														</Button>
													</form>
												{/if}
												<form
													method="POST"
													action="?/deleteLeave"
													use:enhance={enhanceAction(request.id)}
												>
													<input type="hidden" name="id" value={request.id} />
													<Button
														type="submit"
														size="sm"
														variant="outline"
														disabled={busyId === request.id}
													>
														Delete
													</Button>
												</form>
											</div>
										</li>
									{/each}
								</ul>
							{/if}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<h3 class="text-foreground text-base font-medium">WFH history</h3>
							<CardDescription>WFH you have already decided.</CardDescription>
						</CardHeader>
						<CardContent>
							{#if data.decidedWfh.length === 0}
								<p class="text-muted-foreground text-sm">No decided WFH yet.</p>
							{:else}
								<ul class="flex flex-col gap-3">
									{#each data.decidedWfh as request (request.id)}
										<li class="border-border rounded-lg border p-3">
											<div class="flex items-start justify-between gap-3">
												<div class="min-w-0">
													<p class="text-foreground text-sm font-medium">{request.name}</p>
													<p class="text-muted-foreground text-xs">
														{request.email}
														{#if request.employeeId}
															· ID {request.employeeId}
														{/if}
													</p>
												</div>
												<RequestStatusBadge status={request.status} />
											</div>
											<p class="text-foreground mt-2 text-sm">{request.work_date}</p>
											<p class="text-muted-foreground mt-1 text-sm">{request.reason}</p>
											{#if request.decided_at}
												<p class="text-muted-foreground mt-1 text-xs">
													Decided {new Date(request.decided_at).toLocaleString('en-IN')}
												</p>
											{/if}
											<div class="mt-3 flex flex-wrap gap-2">
												{#if request.status !== 'approved'}
													<form
														method="POST"
														action="?/reviseWfh"
														use:enhance={enhanceAction(request.id)}
													>
														<input type="hidden" name="id" value={request.id} />
														<input type="hidden" name="decision" value="approved" />
														<Button type="submit" size="sm" disabled={busyId === request.id}>
															Change to approved
														</Button>
													</form>
												{/if}
												{#if request.status !== 'rejected'}
													<form
														method="POST"
														action="?/reviseWfh"
														use:enhance={enhanceAction(request.id)}
													>
														<input type="hidden" name="id" value={request.id} />
														<input type="hidden" name="decision" value="rejected" />
														<Button
															type="submit"
															size="sm"
															variant="outline"
															disabled={busyId === request.id}
														>
															Change to rejected
														</Button>
													</form>
												{/if}
												<form
													method="POST"
													action="?/deleteWfh"
													use:enhance={enhanceAction(request.id)}
												>
													<input type="hidden" name="id" value={request.id} />
													<Button
														type="submit"
														size="sm"
														variant="outline"
														disabled={busyId === request.id}
													>
														Delete
													</Button>
												</form>
											</div>
										</li>
									{/each}
								</ul>
							{/if}
						</CardContent>
					</Card>
				</div>
			{/if}
		</section>
	{/if}
</div>
