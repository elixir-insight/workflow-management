<script lang="ts">
	import { roleLabels } from '#lib/auth/roles';
	import { Button } from '#lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader } from '#lib/components/ui/card';
	import type { AppRole } from '#lib/supabase/database';

	let { role, email }: { role: AppRole; email: string } = $props();
</script>

<main
	class="bg-background flex min-h-dvh flex-col items-center px-4 pt-[max(4.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]"
>
	<div class="flex w-full max-w-sm flex-1 flex-col justify-center">
		<Card>
			<CardHeader>
				<CardDescription>ElixirPay attendance</CardDescription>
				<h1 class="text-foreground text-2xl font-medium">{roleLabels[role]}</h1>
				{#if email}
					<p class="text-foreground text-sm">{email}</p>
				{/if}
			</CardHeader>
			<CardContent>
				<form method="POST" action="/logout">
					<Button type="submit" variant="outline" class="h-11 w-full">Sign out</Button>
				</form>
			</CardContent>
		</Card>
	</div>
</main>
