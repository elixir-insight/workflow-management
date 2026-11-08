<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		label,
		value,
		hint = '',
		children
	}: {
		label: string;
		value: string | number;
		hint?: string;
		children?: Snippet;
	} = $props();
</script>

<div class="border-border bg-card rounded-2xl border p-4 sm:p-5">
	<p class="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
	<p class="text-foreground mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
	{#if hint}
		<p class="text-muted-foreground mt-1.5 text-xs leading-relaxed">{hint}</p>
	{/if}
	{#if children}
		<div class="mt-3">
			{@render children()}
		</div>
	{/if}
</div>
