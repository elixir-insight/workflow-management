<script lang="ts">
	import { Toaster as Sonner, type ToasterProps as SonnerProps } from 'svelte-sonner';
	import CheckIcon from '@lucide/svelte/icons/check';
	import InfoIcon from '@lucide/svelte/icons/info';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import XIcon from '@lucide/svelte/icons/x';

	let { ...restProps }: SonnerProps = $props();

	let theme = $state<'light' | 'dark'>('light');

	$effect(() => {
		const root = document.documentElement;
		const sync = () => {
			theme = root.classList.contains('dark') ? 'dark' : 'light';
		};

		sync();
		const observer = new MutationObserver(sync);
		observer.observe(root, { attributes: true, attributeFilter: ['class'] });
		return () => observer.disconnect();
	});
</script>

<Sonner
	{theme}
	class="toaster group"
	style="
		--normal-bg: var(--popover);
		--normal-text: var(--popover-foreground);
		--normal-border: var(--border);
		--border-radius: 0.75rem;
		font-family: var(--font-sans);
	"
	toastOptions={{
		classes: {
			toast:
				'cn-toast !gap-3 !rounded-xl !border-border !bg-popover !text-popover-foreground !shadow-[0_8px_30px_rgba(15,23,42,0.12)] dark:!shadow-[0_8px_30px_rgba(0,0,0,0.45)] !font-sans',
			title: '!text-sm !font-medium !text-foreground',
			description: '!text-sm !text-muted-foreground',
			icon: '!size-5 !m-0',
			closeButton:
				'!border-border !bg-popover !text-muted-foreground hover:!bg-muted hover:!text-foreground'
		}
	}}
	{...restProps}
>
	{#snippet loadingIcon()}
		<Loader2Icon class="text-muted-foreground size-5 animate-spin" />
	{/snippet}
	{#snippet successIcon()}
		<span
			class="bg-success text-primary-foreground flex size-5 items-center justify-center rounded-full"
		>
			<CheckIcon class="size-3 stroke-3" aria-hidden="true" />
		</span>
	{/snippet}
	{#snippet errorIcon()}
		<span
			class="bg-destructive text-destructive-foreground flex size-5 items-center justify-center rounded-full"
		>
			<XIcon class="size-3 stroke-3" aria-hidden="true" />
		</span>
	{/snippet}
	{#snippet infoIcon()}
		<span
			class="bg-primary text-primary-foreground flex size-5 items-center justify-center rounded-full"
		>
			<InfoIcon class="size-3 stroke-[2.5]" aria-hidden="true" />
		</span>
	{/snippet}
	{#snippet warningIcon()}
		<span
			class="bg-amber text-primary-foreground flex size-5 items-center justify-center rounded-full"
		>
			<TriangleAlertIcon class="size-3 stroke-[2.5]" aria-hidden="true" />
		</span>
	{/snippet}
</Sonner>
