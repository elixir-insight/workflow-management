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

<div class="bg-muted/40 flex min-h-dvh w-full max-w-full min-w-0 overflow-x-clip">
	<aside class="border-sidebar-border bg-sidebar hidden w-64 max-w-full shrink-0 border-r lg:block">
		<div class="sticky top-0 h-dvh max-h-dvh overflow-y-auto overscroll-contain">
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

	<div class="flex w-full max-w-full min-w-0 flex-1 flex-col overflow-x-clip">
		<header
			class="border-border/80 bg-background/80 sticky top-0 z-20 flex min-h-14 w-full max-w-full min-w-0 items-center gap-2 overflow-x-clip border-b px-3 pt-[env(safe-area-inset-top)] backdrop-blur-md sm:gap-3 sm:px-4 md:min-h-16 md:px-6 lg:px-8"
		>
			<Button
				variant="outline"
				size="icon"
				class="size-10 shrink-0 rounded-xl lg:hidden"
				aria-label="Open menu"
				aria-expanded={menuOpen}
				onclick={() => (menuOpen = true)}
			>
				<Menu class="size-4" />
			</Button>

			{#if menuOpen}
				<Sheet.Root bind:open={menuOpen}>
					<Sheet.Content
						side="left"
						class="bg-sidebar w-[min(18rem,calc(100%-2.5rem))] max-w-full p-0"
						showCloseButton={false}
					>
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
			{/if}

			<div class="min-w-0 flex-1 overflow-hidden">
				<p class="text-muted-foreground truncate text-[11px] font-medium tracking-wide uppercase">
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
			class="relative w-full max-w-full min-w-0 flex-1 overflow-x-clip px-3 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-4 md:px-6 md:py-6 lg:px-8 lg:py-8"
			aria-busy={isNavigating}
		>
			<div
				class={[
					'mx-auto w-full max-w-7xl min-w-0 overflow-x-clip transition-opacity duration-150',
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
