<script lang="ts">
	import { navigating } from '$app/state';

	const active = $derived(Boolean(navigating.to));
</script>

{#if active}
	<div
		class="pointer-events-none fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-black/5 dark:bg-white/10"
		aria-hidden="true"
	>
		<div class="bg-primary nav-progress-bar h-full w-2/5 rounded-full"></div>
	</div>
{/if}

<style>
	.nav-progress-bar {
		animation: nav-progress 0.9s ease-in-out infinite;
	}

	@keyframes nav-progress {
		0% {
			transform: translateX(-120%);
		}
		100% {
			transform: translateX(280%);
		}
	}
</style>
