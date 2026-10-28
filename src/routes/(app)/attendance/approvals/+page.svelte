<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Button } from '#lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader } from '#lib/components/ui/card';
	import { toast } from 'svelte-sonner';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let busyId = $state<string | null>(null);
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
		Approve leave and WFH for people who report to you. People with no reporting lead don’t need
		approval.
	</p>

	{#if !data.isManager && data.leaveRequests.length === 0 && data.wfhRequests.length === 0}
		<Card>
			<CardHeader>
				<h2 class="text-foreground text-lg font-medium">No approvals needed</h2>
				<CardDescription>
					You don’t currently have direct reports with pending leave or WFH requests.
				</CardDescription>
			</CardHeader>
		</Card>
	{:else}
		<div class="grid gap-6 lg:grid-cols-2">
			<Card>
				<CardHeader>
					<h2 class="text-foreground text-lg font-medium">Leave approvals</h2>
					<CardDescription>Pending leave from people who report to you.</CardDescription>
				</CardHeader>
				<CardContent>
					{#if data.leaveRequests.length === 0}
						<p class="text-muted-foreground text-sm">No pending leave requests.</p>
					{:else}
						<ul class="flex flex-col gap-3">
							{#each data.leaveRequests as request (request.id)}
								<li class="border-border rounded-lg border p-3">
									<p class="text-foreground text-sm font-medium">{request.name}</p>
									<p class="text-muted-foreground text-xs">
										{request.email}
										{#if request.employeeId}
											· ID {request.employeeId}
										{/if}
									</p>
									<p class="text-foreground mt-2 text-sm capitalize">
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
									<div class="mt-3 flex gap-2">
										<form
											method="POST"
											action="?/decideLeave"
											use:enhance={() => {
												busyId = request.id;
												return async ({ result, update }) => {
													try {
														await update();
														if (
															result.type === 'failure' &&
															typeof result.data?.error === 'string'
														) {
															toast.error(result.data.error);
														}
													} finally {
														busyId = null;
													}
												};
											}}
										>
											<input type="hidden" name="id" value={request.id} />
											<input type="hidden" name="decision" value="approved" />
											<Button type="submit" size="sm" disabled={busyId === request.id}>
												Approve
											</Button>
										</form>
										<form
											method="POST"
											action="?/decideLeave"
											use:enhance={() => {
												busyId = request.id;
												return async ({ result, update }) => {
													try {
														await update();
														if (
															result.type === 'failure' &&
															typeof result.data?.error === 'string'
														) {
															toast.error(result.data.error);
														}
													} finally {
														busyId = null;
													}
												};
											}}
										>
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
									</div>
								</li>
							{/each}
						</ul>
					{/if}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<h2 class="text-foreground text-lg font-medium">WFH approvals</h2>
					<CardDescription>Pending WFH from people who report to you.</CardDescription>
				</CardHeader>
				<CardContent>
					{#if data.wfhRequests.length === 0}
						<p class="text-muted-foreground text-sm">No pending WFH requests.</p>
					{:else}
						<ul class="flex flex-col gap-3">
							{#each data.wfhRequests as request (request.id)}
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
									<div class="mt-3 flex gap-2">
										<form
											method="POST"
											action="?/decideWfh"
											use:enhance={() => {
												busyId = request.id;
												return async ({ result, update }) => {
													try {
														await update();
														if (
															result.type === 'failure' &&
															typeof result.data?.error === 'string'
														) {
															toast.error(result.data.error);
														}
													} finally {
														busyId = null;
													}
												};
											}}
										>
											<input type="hidden" name="id" value={request.id} />
											<input type="hidden" name="decision" value="approved" />
											<Button type="submit" size="sm" disabled={busyId === request.id}>
												Approve
											</Button>
										</form>
										<form
											method="POST"
											action="?/decideWfh"
											use:enhance={() => {
												busyId = request.id;
												return async ({ result, update }) => {
													try {
														await update();
														if (
															result.type === 'failure' &&
															typeof result.data?.error === 'string'
														) {
															toast.error(result.data.error);
														}
													} finally {
														busyId = null;
													}
												};
											}}
										>
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
									</div>
								</li>
							{/each}
						</ul>
					{/if}
				</CardContent>
			</Card>
		</div>
	{/if}
</div>
