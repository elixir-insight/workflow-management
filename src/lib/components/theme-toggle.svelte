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
	class="border-border bg-card flex h-11 items-center gap-2 rounded-lg border px-3 {fixed
		? 'fixed top-[max(0.75rem,env(safe-area-inset-top))] right-4 z-10'
		: ''} {className}"
>
	<Sun class="text-foreground size-4 {dark ? 'opacity-40' : ''}" aria-hidden="true" />
	<Switch bind:checked={dark} aria-label="Dark mode" />
	<Moon class="text-foreground size-4 {dark ? '' : 'opacity-40'}" aria-hidden="true" />
</div>
