<script lang="ts">
	import { navigating, page } from '$app/state';
	import AppSidebar from '#lib/components/admin/sidebar.svelte';
	import PageLoader from '#lib/components/page-loader.svelte';
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

<div class="bg-background flex min-h-dvh">
	<aside class="border-sidebar-border bg-sidebar hidden w-64 shrink-0 border-r md:block">
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
			class="border-border bg-background/95 sticky top-0 z-20 flex h-14 items-center gap-3 border-b px-4 backdrop-blur md:h-16 md:px-6"
		>
			<Button
				variant="outline"
				size="icon"
				class="md:hidden"
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

			<div class="min-w-0">
				<p class="text-muted-foreground text-xs">ElixirPay attendance</p>
				<h1 class="text-foreground truncate text-base font-medium md:text-lg">
					{title}
					{#if isNavigating}
						<span class="text-muted-foreground font-normal"> · loading</span>
					{/if}
				</h1>
			</div>
		</header>

		<main class="flex-1 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:p-4">
			<div
				class="border-border bg-card ring-foreground/10 relative min-h-[calc(100dvh-5.5rem)] overflow-hidden rounded-xl border p-4 shadow-sm ring-1 md:min-h-[calc(100dvh-6.5rem)] md:p-6"
				aria-busy={isNavigating}
			>
				<div
					class={[
						'transition-opacity duration-150',
						isNavigating && 'pointer-events-none opacity-35'
					]}
				>
					{@render children()}
				</div>

				{#if isNavigating}
					<div
						class="bg-card/85 absolute inset-0 z-10 flex items-center justify-center rounded-xl backdrop-blur-[2px]"
					>
						<PageLoader compact label="Loading page…" />
					</div>
				{/if}
			</div>
		</main>
	</div>
</div>
