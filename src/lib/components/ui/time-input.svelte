<script lang="ts">
	import { cn } from '#lib/utils.js';
	import Clock from '@lucide/svelte/icons/clock';
	import type { HTMLInputAttributes } from 'svelte/elements';

	let {
		id,
		name,
		value = '',
		class: className,
		...restProps
	}: Omit<HTMLInputAttributes, 'type' | 'value' | 'class'> & {
		id?: string;
		name?: string;
		value?: string;
		class?: string;
	} = $props();

	let inputEl = $state<HTMLInputElement | null>(null);

	function openPicker() {
		const input = inputEl;
		if (!input || input.disabled || input.readOnly) return;

		try {
			if (typeof input.showPicker === 'function') {
				input.showPicker();
				return;
			}
		} catch {
			// showPicker can throw when the browser blocks it; fall through to focus.
		}

		input.focus();
	}
</script>

<div class="relative">
	<input
		bind:this={inputEl}
		{id}
		{name}
		type="time"
		{value}
		class={cn(
			'dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive time-input-field relative z-0 h-11 w-full min-w-0 cursor-pointer rounded-lg border bg-transparent py-1 pr-10 pl-2.5 text-base outline-none transition-colors focus-visible:ring-3 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
			className
		)}
		onclick={openPicker}
		{...restProps}
	/>
	<button
		type="button"
		tabindex="-1"
		class="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 z-10 flex w-10 items-center justify-center rounded-r-lg"
		aria-label="Choose time"
		onclick={(event) => {
			event.preventDefault();
			openPicker();
		}}
	>
		<Clock class="size-4" aria-hidden="true" />
	</button>
</div>

<style>
	.time-input-field {
		color-scheme: inherit;
	}

	/* Stretch the native picker hit-target across the field where WebKit/Chromium expose it. */
	.time-input-field::-webkit-calendar-picker-indicator {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		margin: 0;
		padding: 0;
		opacity: 0;
		cursor: pointer;
	}
</style>
