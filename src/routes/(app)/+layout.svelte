<script lang="ts">
	import { navigating, page } from '$app/state';
	import AppSidebar from '#lib/components/admin/sidebar.svelte';
	import PageLoader from '#lib/components/page-loader.svelte';
	import ThemeToggle from '#lib/components/theme-toggle.svelte';
	import { Button } from '#lib/components/ui/button';
	import * as Sheet from '#lib/components/ui/sheet';
	import { pageTitleForPath } from '#lib/navigation/page-title';
	import Menu from '@lucide/svelte/icons/menu';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	let menuOpen = $state(false);

	const isNavigating = $derived(Boolean(navigating.to));
	const title = $derived(
		pageTitleForPath(navigating.to?.url.pathname ?? page.url.pathname)
	);

	$effect(() => {
		if (page.url.pathname) {
			menuOpen = false;
		}
	});
</script>

<div class="bg-muted/40 flex min-h-dvh">
	<aside class="border-sidebar-border bg-sidebar hidden w-64 shrink-0 border-r lg:block">
		<div class="sticky top-0 h-dvh">
			{#if data.session}
				<AppSidebar
					email={data.session.email}
					role={data.session.role}
					firstName={data.session.firstName}
					lastName={data.session.lastName}
					avatarUrl={data.session.avatarUrl}
				/>
			{/if}
		</div>
	</aside>

	<div class="flex min-w-0 flex-1 flex-col">
		<header
			class="border-border/80 bg-background/80 sticky top-0 z-20 flex h-14 items-center gap-3 border-b px-4 backdrop-blur-md md:h-16 md:px-6 lg:px-8"
		>
			<Button
				variant="outline"
				size="icon"
				class="rounded-xl lg:hidden"
				aria-label="Open menu"
				aria-expanded={menuOpen}
				onclick={() => (menuOpen = true)}
			>
				<Menu class="size-4" />
			</Button>

			<Sheet.Root bind:open={menuOpen}>
				<Sheet.Content side="left" class="bg-sidebar w-72 p-0 sm:max-w-xs" showCloseButton={false}>
					{#if data.session}
						<AppSidebar
							email={data.session.email}
							role={data.session.role}
							firstName={data.session.firstName}
							lastName={data.session.lastName}
							avatarUrl={data.session.avatarUrl}
						/>
					{/if}
				</Sheet.Content>
			</Sheet.Root>

			<div class="min-w-0 flex-1">
				<p class="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
					ElixirPay
				</p>
				<h1 class="text-foreground truncate text-base font-semibold tracking-tight md:text-lg">
					{title}
					{#if isNavigating}
						<span class="text-muted-foreground font-normal"> · loading</span>
					{/if}
				</h1>
			</div>

			<ThemeToggle fixed={false} class="h-10 shrink-0 rounded-xl" />
		</header>

		<main
			class="relative flex-1 px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:px-6 md:py-6 lg:px-8 lg:py-8"
			aria-busy={isNavigating}
		>
			<div
				class={[
					'mx-auto w-full max-w-7xl transition-opacity duration-150',
					isNavigating && 'pointer-events-none opacity-40'
				]}
			>
				{@render children()}
			</div>

			{#if isNavigating}
				<div
					class="bg-background/70 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-[2px]"
				>
					<PageLoader compact label="Loading page…" />
				</div>
			{/if}
		</main>
	</div>
</div>
