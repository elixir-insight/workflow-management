<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const links = [
		{ href: '/admin', label: 'Dashboard' },
		{ href: '/admin/users', label: 'User management' }
	] as const;
</script>

<div class="bg-background min-h-dvh px-4 pt-6 pb-24">
	<div class="mx-auto flex w-full max-w-lg flex-col gap-6">
		{@render children()}
	</div>
</div>

<nav class="border-border bg-card fixed inset-x-0 bottom-0 z-10 border-t" aria-label="Admin">
	<div class="mx-auto grid max-w-lg grid-cols-2 pb-[env(safe-area-inset-bottom)]">
		{#each links as link (link.href)}
			<a
				href={resolve(link.href)}
				class="text-foreground flex h-14 items-center justify-center text-sm font-medium aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground"
				aria-current={page.url.pathname === link.href ? 'page' : undefined}
			>
				{link.label}
			</a>
		{/each}
	</div>
</nav>
