<script lang="ts">
	let {
		label = 'Loading…',
		compact = false
	}: {
		label?: string;
		compact?: boolean;
	} = $props();
</script>

<div
	class={[
		'flex flex-col items-center justify-center gap-3 text-center',
		compact ? 'py-10' : 'min-h-[40vh] py-16'
	]}
	role="status"
	aria-live="polite"
	aria-busy="true"
>
	<span
		class="border-muted-foreground/25 border-t-foreground size-8 animate-spin rounded-full border-2"
		aria-hidden="true"
	></span>
	<p class="text-muted-foreground text-sm">{label}</p>
</div>
