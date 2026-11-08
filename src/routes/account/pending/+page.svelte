<script lang="ts">
	import { accessContact } from '#lib/auth/access';
	import logo from '#lib/assets/elixirpay-logo.png';
	import { Button } from '#lib/components/ui/button';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const denied = $derived(data.session?.status === 'denied');
</script>

<svelte:head>
	<title>{denied ? 'Access denied' : 'Profile under approval'} · ElixirPay</title>
</svelte:head>

<main
	class="bg-background flex min-h-dvh flex-col items-center px-6 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]"
>
	<div class="flex w-full max-w-[24rem] flex-1 flex-col justify-center gap-9">
		<img src={logo} alt="ElixirPay" class="h-9 w-auto max-w-46 object-contain" />

		<div class="flex flex-col gap-3">
			<h1 class="text-foreground text-[1.75rem] leading-tight font-semibold tracking-tight">
				{denied ? 'Access denied' : 'Profile under approval'}
			</h1>
			<p class="text-muted-foreground text-sm leading-relaxed">
				Please contact
				<a class="text-primary font-medium hover:underline" href="mailto:{accessContact}"
					>{accessContact}</a
				>.
			</p>
			{#if data.session?.email}
				<p class="text-foreground text-sm">{data.session.email}</p>
			{/if}
		</div>

		<form method="POST" action="/logout">
			<Button type="submit" variant="outline" class="border-border h-11 w-full rounded-md"
				>Sign out</Button
			>
		</form>
	</div>
</main>
