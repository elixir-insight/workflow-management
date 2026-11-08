<script lang="ts">
	import { Switch } from '#lib/components/ui/switch';
	import Moon from '@lucide/svelte/icons/moon';
	import Sun from '@lucide/svelte/icons/sun';

	let {
		class: className = '',
		fixed = true
	}: {
		class?: string;
		fixed?: boolean;
	} = $props();

	let dark = $state(false);
	let ready = false;

	function apply(next: boolean) {
		document.documentElement.classList.toggle('dark', next);
	}

	$effect(() => {
		if (!ready) {
			ready = true;
			if (localStorage.getItem('theme') === 'dark' && !dark) {
				dark = true;
				return;
			}
		}

		apply(dark);
		localStorage.setItem('theme', dark ? 'dark' : 'light');
	});
</script>

<div
	class="border-border bg-muted text-foreground shadow-sm flex h-11 max-w-full shrink-0 items-center gap-2 rounded-lg border px-3 dark:bg-card dark:shadow-none {fixed
		? 'fixed top-[max(0.75rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] z-10'
		: ''} {className}"
>
	<Sun class="size-4 {dark ? 'opacity-40' : ''}" aria-hidden="true" />
	<Switch
		bind:checked={dark}
		aria-label="Dark mode"
		class="data-[state=unchecked]:bg-secondary-foreground/25 dark:data-[state=unchecked]:bg-input/80"
	/>
	<Moon class="size-4 {dark ? '' : 'opacity-40'}" aria-hidden="true" />
</div>
