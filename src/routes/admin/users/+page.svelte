<script lang="ts">
	import { enhance } from '$app/forms';
	import { roleLabels, roles } from '#lib/auth/roles';
	import { Button } from '#lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader } from '#lib/components/ui/card';
	import { Input } from '#lib/components/ui/input';
	import { Label } from '#lib/components/ui/label';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let approvingId = $state('');

	const fieldClass =
		'border-input bg-background text-foreground h-11 w-full rounded-lg border px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 md:text-sm';
</script>

<svelte:head>
	<title>User management · ElixirPay</title>
</svelte:head>

<header class="flex flex-col gap-1">
	<h1 class="text-foreground text-2xl font-medium">User management</h1>
	<p class="text-muted-foreground text-sm">People waiting for access.</p>
</header>

{#if data.loadError}
	<p role="alert" class="text-destructive text-sm">{data.loadError}</p>
{/if}

{#if data.requests.length === 0}
	<Card>
		<CardHeader>
			<CardDescription>No one is waiting for approval.</CardDescription>
		</CardHeader>
	</Card>
{:else}
	<ul class="flex flex-col gap-4">
		{#each data.requests as request (request.id)}
			<li>
				<Card>
					<CardHeader>
						<h2 class="text-foreground text-lg font-medium">{request.email}</h2>
						<CardDescription>Profile under approval</CardDescription>
					</CardHeader>
					<CardContent>
						<form
							method="POST"
							action="?/approve"
							class="flex flex-col gap-4"
							use:enhance={() => {
								approvingId = request.id;
								return async ({ update }) => {
									try {
										await update();
									} finally {
										approvingId = '';
									}
								};
							}}
						>
							<input type="hidden" name="id" value={request.id} />

							<div class="flex flex-col gap-2">
								<Label for="role-{request.id}">Role</Label>
								<select id="role-{request.id}" name="role" required class={fieldClass}>
									{#each roles as role (role)}
										<option value={role}>{roleLabels[role]}</option>
									{/each}
								</select>
							</div>

							<div class="flex flex-col gap-2">
								<Label for="reports-{request.id}">Reports to</Label>
								<select id="reports-{request.id}" name="reportsTo" class={fieldClass}>
									<option value="">No one</option>
									{#each data.managers as manager (manager.id)}
										<option value={manager.id}>
											{manager.email}{manager.designation ? ` · ${manager.designation}` : ''}
										</option>
									{/each}
								</select>
							</div>

							<div class="flex flex-col gap-2">
								<Label for="designation-{request.id}">Designation</Label>
								<Input id="designation-{request.id}" name="designation" required class="h-11" />
							</div>

							<fieldset class="grid grid-cols-3 gap-3">
								<legend class="text-foreground mb-2 text-sm font-medium">Leave balances</legend>
								<div class="flex flex-col gap-2">
									<Label for="casual-{request.id}">Casual</Label>
									<Input
										id="casual-{request.id}"
										name="casualLeave"
										type="number"
										min="0"
										step="0.5"
										value="0"
										required
										class="h-11"
									/>
								</div>
								<div class="flex flex-col gap-2">
									<Label for="sick-{request.id}">Sick</Label>
									<Input
										id="sick-{request.id}"
										name="sickLeave"
										type="number"
										min="0"
										step="0.5"
										value="0"
										required
										class="h-11"
									/>
								</div>
								<div class="flex flex-col gap-2">
									<Label for="earned-{request.id}">Earned</Label>
									<Input
										id="earned-{request.id}"
										name="earnedLeave"
										type="number"
										min="0"
										step="0.5"
										value="0"
										required
										class="h-11"
									/>
								</div>
							</fieldset>

							{#if form?.error && form.id === request.id}
								<p role="alert" class="text-destructive text-sm">{form.error}</p>
							{/if}

							<Button type="submit" class="h-11 w-full" disabled={approvingId === request.id}>
								{approvingId === request.id ? 'Saving…' : 'Grant access'}
							</Button>
						</form>
					</CardContent>
				</Card>
			</li>
		{/each}
	</ul>
{/if}
