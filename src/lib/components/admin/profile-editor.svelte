<script lang="ts">
	import { enhance } from '$app/forms';
	import { roleLabels, roles } from '#lib/auth/roles';
	import { accessStatusLabels, accessStatuses } from '#lib/auth/status';
	import { Button } from '#lib/components/ui/button';
	import { Input } from '#lib/components/ui/input';
	import { Label } from '#lib/components/ui/label';
	import StatusDot from '#lib/components/ui/status-dot.svelte';
	import type { AccessStatus, AppRole } from '#lib/supabase/database';
	import { toast } from 'svelte-sonner';

	type Manager = { id: string; email: string; designation: string };
	type Vertical = { id: string; name: string };

	let {
		profile,
		managers,
		verticals,
		error = null,
		action = '?/save'
	}: {
		profile: {
			id: string;
			status: AccessStatus;
			role: AppRole | null;
			vertical_id: string | null;
			reports_to: string | null;
			designation: string;
			employee_id: string | null;
			casual_leave: number;
			earned_leave: number;
		};
		managers: Manager[];
		verticals: Vertical[];
		error?: string | null;
		action?: string;
	} = $props();

	let saving = $state(false);

	const fieldClass =
		'border-input bg-background text-foreground h-11 w-full rounded-lg border px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 md:text-sm';
</script>

<form
	method="POST"
	{action}
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
	<input type="hidden" name="id" value={profile.id} />

	<div class="flex flex-col gap-2">
		<Label for="status" class="flex items-center gap-2">
			Access
			<StatusDot status={profile.status} />
		</Label>
		<select id="status" name="status" required class={fieldClass} value={profile.status}>
			{#each accessStatuses as status (status)}
				<option value={status}>{accessStatusLabels[status]}</option>
			{/each}
		</select>
	</div>

	<div class="flex flex-col gap-2">
		<Label for="verticalId">Vertical</Label>
		<select id="verticalId" name="verticalId" class={fieldClass} value={profile.vertical_id ?? ''}>
			<option value="">Unassigned</option>
			{#each verticals as vertical (vertical.id)}
				<option value={vertical.id}>{vertical.name}</option>
			{/each}
		</select>
	</div>

	<div class="flex flex-col gap-2">
		<Label for="role">Role</Label>
		<select id="role" name="role" class={fieldClass} value={profile.role ?? ''}>
			<option value="">None</option>
			{#each roles as role (role)}
				<option value={role}>{roleLabels[role]}</option>
			{/each}
		</select>
	</div>

	<div class="flex flex-col gap-2">
		<Label for="reportsTo">Reports to</Label>
		<select id="reportsTo" name="reportsTo" class={fieldClass} value={profile.reports_to ?? ''}>
			<option value="">No one</option>
			{#each managers as manager (manager.id)}
				<option value={manager.id}>
					{manager.email}{manager.designation ? ` · ${manager.designation}` : ''}
				</option>
			{/each}
		</select>
	</div>

	<div class="flex flex-col gap-2">
		<Label for="employeeId">Employee ID</Label>
		<Input
			id="employeeId"
			name="employeeId"
			value={profile.employee_id ?? ''}
			placeholder="Unique organisation ID"
			autocomplete="off"
			class="h-11"
		/>
	</div>

	<div class="flex flex-col gap-2">
		<Label for="designation">Designation</Label>
		<Input id="designation" name="designation" value={profile.designation} class="h-11" />
	</div>

	<fieldset class="grid grid-cols-2 gap-3">
		<legend class="text-foreground mb-2 text-sm font-medium">Leave balances</legend>
		<div class="flex flex-col gap-2">
			<Label for="casualLeave">Casual</Label>
			<Input
				id="casualLeave"
				name="casualLeave"
				type="number"
				min="0"
				step="0.5"
				value={profile.casual_leave}
				class="h-11"
			/>
		</div>
		<div class="flex flex-col gap-2">
			<Label for="earnedLeave">Earned</Label>
			<Input
				id="earnedLeave"
				name="earnedLeave"
				type="number"
				min="0"
				step="0.5"
				value={profile.earned_leave}
				class="h-11"
			/>
		</div>
	</fieldset>

	{#if error}
		<p role="alert" class="text-destructive text-sm">{error}</p>
	{/if}

	<Button type="submit" class="h-11 w-full" disabled={saving}>
		{saving ? 'Saving…' : 'Save'}
	</Button>
</form>
