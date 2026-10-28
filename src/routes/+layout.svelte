<script lang="ts">
	import { page } from '$app/state';
	import favicon from '#lib/assets/favicon.svg';
	import FlashToaster from '#lib/components/flash-toaster.svelte';
	import NavProgress from '#lib/components/nav-progress.svelte';
	import ThemeToggle from '#lib/components/theme-toggle.svelte';
	import type { LayoutProps } from './$types';
	import './layout.css';

	let { children, data }: LayoutProps = $props();

	const showThemeToggle = $derived(
		!page.url.pathname.startsWith('/admin') &&
			!page.url.pathname.startsWith('/payroll') &&
			!page.url.pathname.startsWith('/user') &&
			!page.url.pathname.startsWith('/attendance') &&
			!page.url.pathname.startsWith('/timesheet') &&
			page.url.pathname !== '/profile'
	);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<NavProgress />
<FlashToaster flash={data.flash} />

{#if showThemeToggle}
	<ThemeToggle />
{/if}
{@render children()}
