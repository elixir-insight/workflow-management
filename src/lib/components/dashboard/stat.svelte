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

<div class="border-border rounded-lg border p-3">
	<p class="text-muted-foreground text-xs">{label}</p>
	<p class="text-foreground mt-1 text-2xl font-medium tabular-nums">{value}</p>
	{#if hint}
		<p class="text-muted-foreground mt-1 text-xs">{hint}</p>
	{/if}
	{#if children}
		<div class="mt-2">
			{@render children()}
		</div>
	{/if}
</div>
