<script lang="ts">
	import { resolve } from '$app/paths';
	import { isPlatformAdminEmail } from '#lib/auth/platform-admin';
	import { roleLabels } from '#lib/auth/roles';
	import UserAvatar from '#lib/components/user-avatar.svelte';
	import { Button } from '#lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader } from '#lib/components/ui/card';
	import { profileDisplayName } from '#lib/profile/display';
	import type { AppRole } from '#lib/supabase/database';

	let {
		role,
		email,
		firstName = '',
		lastName = '',
		avatarUrl = null
	}: {
		role: AppRole;
		email: string;
		firstName?: string;
		lastName?: string;
		avatarUrl?: string | null;
	} = $props();

	const displayName = $derived(
		profileDisplayName({ first_name: firstName, last_name: lastName, email })
	);
</script>

<div class="mx-auto flex w-full max-w-sm flex-col justify-center py-6">
	<Card>
		<CardHeader class="items-center text-center">
			<UserAvatar
				{firstName}
				{lastName}
				{email}
				src={avatarUrl}
				size="lg"
				class="mx-auto"
			/>
			<CardDescription>ElixirPay attendance</CardDescription>
			<h2 class="text-foreground text-2xl font-medium">{roleLabels[role]}</h2>
			<p class="text-foreground text-sm">{displayName}</p>
			{#if email}
				<p class="text-muted-foreground text-sm">{email}</p>
			{/if}
		</CardHeader>
		<CardContent class="flex flex-col gap-3">
			{#if role === 'payroll'}
				<Button href={resolve('/(app)/admin/users')} class="h-11 w-full">User management</Button>
			{/if}
			{#if !isPlatformAdminEmail(email)}
				<Button href={resolve('/(app)/attendance')} class="h-11 w-full">Attendance</Button>
			{/if}
			<Button href={resolve('/(app)/profile')} variant="outline" class="h-11 w-full">
				My profile
			</Button>
		</CardContent>
	</Card>
</div>
