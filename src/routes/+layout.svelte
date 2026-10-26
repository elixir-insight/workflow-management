<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import ThemeToggle from '#lib/components/theme-toggle.svelte';
	import type { LayoutProps } from './$types';
	import './layout.css';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ThemeToggle />
{@render children()}
