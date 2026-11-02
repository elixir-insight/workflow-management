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
		action = '?/save',
		canEditAll = true
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
			first_name: string;
			last_name: string;
			phone: string;
			present_address: string;
			timesheet_exempt: boolean;
		};
		managers: Manager[];
		verticals: Vertical[];
		error?: string | null;
		action?: string;
		canEditAll?: boolean;
	} = $props();

	let saving = $state(false);

	const fieldClass =
		'border-input bg-background text-foreground h-11 w-full rounded-lg border px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 md:text-sm';
	const readonlyClass = `${fieldClass} bg-muted/40 text-muted-foreground`;
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

	{#if !canEditAll}
		<input type="hidden" name="status" value={profile.status} />
		<input type="hidden" name="verticalId" value={profile.vertical_id ?? ''} />
		<input type="hidden" name="role" value={profile.role ?? ''} />
		<input type="hidden" name="reportsTo" value={profile.reports_to ?? ''} />
		<input type="hidden" name="employeeId" value={profile.employee_id ?? ''} />
		<input type="hidden" name="designation" value={profile.designation} />
		<input type="hidden" name="firstName" value={profile.first_name} />
		<input type="hidden" name="lastName" value={profile.last_name} />
		<input type="hidden" name="phone" value={profile.phone} />
		<input type="hidden" name="presentAddress" value={profile.present_address} />
		<input type="hidden" name="timesheetExempt" value={profile.timesheet_exempt ? 'true' : 'false'} />
	{/if}

	{#if canEditAll}
		<div class="grid gap-4 sm:grid-cols-2">
			<div class="flex flex-col gap-2">
				<Label for="firstName">First name</Label>
				<Input id="firstName" name="firstName" value={profile.first_name} class="h-11" />
			</div>
			<div class="flex flex-col gap-2">
				<Label for="lastName">Last name</Label>
				<Input id="lastName" name="lastName" value={profile.last_name} class="h-11" />
			</div>
		</div>

		<div class="flex flex-col gap-2">
			<Label for="phone">Phone number</Label>
			<Input id="phone" name="phone" type="tel" value={profile.phone} class="h-11" />
		</div>

		<div class="flex flex-col gap-2">
			<Label for="presentAddress">Present address</Label>
			<textarea
				id="presentAddress"
				name="presentAddress"
				rows="3"
				class="border-input bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border px-2.5 py-2 text-base outline-none focus-visible:ring-3 md:text-sm"
			>{profile.present_address}</textarea>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2">
			<div class="flex flex-col gap-2">
				<Label for="firstNameReadonly">First name</Label>
				<Input
					id="firstNameReadonly"
					value={profile.first_name}
					readonly
					class="h-11 bg-muted/40 text-muted-foreground"
				/>
			</div>
			<div class="flex flex-col gap-2">
				<Label for="lastNameReadonly">Last name</Label>
				<Input
					id="lastNameReadonly"
					value={profile.last_name}
					readonly
					class="h-11 bg-muted/40 text-muted-foreground"
				/>
			</div>
		</div>
	{/if}

	<div class="flex flex-col gap-2">
		<Label for="status" class="flex items-center gap-2">
			Access
			<StatusDot status={profile.status} />
		</Label>
		<select
			id="status"
			name={canEditAll ? 'status' : undefined}
			required={canEditAll}
			disabled={!canEditAll}
			class={canEditAll ? fieldClass : readonlyClass}
			value={profile.status}
		>
			{#each accessStatuses as status (status)}
				<option value={status}>{accessStatusLabels[status]}</option>
			{/each}
		</select>
	</div>

	<div class="flex flex-col gap-2">
		<Label for="verticalId">Vertical</Label>
		<select
			id="verticalId"
			name={canEditAll ? 'verticalId' : undefined}
			disabled={!canEditAll}
			class={canEditAll ? fieldClass : readonlyClass}
			value={profile.vertical_id ?? ''}
		>
			<option value="">Unassigned</option>
			{#each verticals as vertical (vertical.id)}
				<option value={vertical.id}>{vertical.name}</option>
			{/each}
		</select>
	</div>

	<div class="flex flex-col gap-2">
		<Label for="role">Role</Label>
		<select
			id="role"
			name={canEditAll ? 'role' : undefined}
			disabled={!canEditAll}
			class={canEditAll ? fieldClass : readonlyClass}
			value={profile.role ?? ''}
		>
			<option value="">None</option>
			{#each roles as role (role)}
				<option value={role}>{roleLabels[role]}</option>
			{/each}
		</select>
	</div>

	<div class="flex flex-col gap-2">
		<Label for="reportsTo">Reports to</Label>
		<select
			id="reportsTo"
			name={canEditAll ? 'reportsTo' : undefined}
			disabled={!canEditAll}
			class={canEditAll ? fieldClass : readonlyClass}
			value={profile.reports_to ?? ''}
		>
			<option value="">No one</option>
			{#each managers as manager (manager.id)}
				<option value={manager.id}>
					{manager.email}{manager.designation ? ` · ${manager.designation}` : ''}
				</option>
			{/each}
		</select>
		<p class="text-muted-foreground text-xs">
			If set, leave and WFH need this person’s approval. If empty, leave and WFH are recorded
			immediately.
		</p>
	</div>

	<div class="flex flex-col gap-2">
		<Label for="employeeId">
			Employee ID
			<span class="text-muted-foreground font-normal">(optional)</span>
		</Label>
		<Input
			id="employeeId"
			name={canEditAll ? 'employeeId' : undefined}
			value={profile.employee_id ?? ''}
			placeholder="Unique organisation ID"
			autocomplete="off"
			readonly={!canEditAll}
			class={canEditAll ? 'h-11' : 'h-11 bg-muted/40 text-muted-foreground'}
		/>
	</div>

	<div class="flex flex-col gap-2">
		<Label for="designation">Designation</Label>
		<Input
			id="designation"
			name={canEditAll ? 'designation' : undefined}
			value={profile.designation}
			readonly={!canEditAll}
			class={canEditAll ? 'h-11' : 'h-11 bg-muted/40 text-muted-foreground'}
		/>
	</div>

	{#if canEditAll}
		<label class="border-border flex items-start gap-3 rounded-lg border p-3">
			<input
				type="checkbox"
				name="timesheetExempt"
				value="true"
				checked={profile.timesheet_exempt}
				class="border-input mt-1 size-4 rounded"
			/>
			<span>
				<span class="text-foreground text-sm font-medium">Exempt from timesheet</span>
				<span class="text-muted-foreground mt-0.5 block text-xs">
					Hide this person from the monthly timesheet grid and CSV export.
				</span>
			</span>
		</label>
	{:else if profile.timesheet_exempt}
		<p class="text-muted-foreground text-sm">This person is exempt from the timesheet.</p>
	{/if}

	<fieldset class="grid grid-cols-2 gap-3">
		<legend class="text-foreground mb-2 text-sm font-medium">
			Leave balances
			{#if !canEditAll}
				<span class="text-muted-foreground font-normal"> · editable</span>
			{/if}
		</legend>
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
		{saving ? 'Saving…' : canEditAll ? 'Save' : 'Save leave balances'}
	</Button>
</form>
