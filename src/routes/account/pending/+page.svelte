<script lang="ts">
	import { accessContact } from '#lib/auth/access';
	import logo from '#lib/assets/elixirpay-logo.png';
	import { Button } from '#lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader } from '#lib/components/ui/card';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Profile under approval · ElixirPay</title>
</svelte:head>

<main
	class="bg-background flex min-h-dvh flex-col items-center px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]"
>
	<div class="flex w-full max-w-sm flex-1 flex-col justify-center gap-6">
		<div class="flex flex-col items-center gap-2">
			<div class="bg-primary-foreground dark:bg-foreground rounded-lg px-3 py-2">
				<img src={logo} alt="ElixirPay" class="h-14 w-auto max-w-full" />
			</div>
			<p class="text-muted-foreground text-sm">Attendance</p>
		</div>

		<Card>
			<CardHeader>
				<h1 class="text-foreground text-2xl font-medium">Profile under approval</h1>
				<CardDescription>
					Please contact
					<a class="text-foreground underline" href="mailto:{accessContact}">{accessContact}</a>.
				</CardDescription>
			</CardHeader>
			<CardContent class="flex flex-col gap-4">
				{#if data.session?.email}
					<p class="text-foreground text-sm">{data.session.email}</p>
				{/if}
				<form method="POST" action="/logout">
					<Button type="submit" variant="outline" class="h-11 w-full">Sign out</Button>
				</form>
			</CardContent>
		</Card>
	</div>
</main>
