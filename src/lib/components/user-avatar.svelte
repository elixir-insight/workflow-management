<script lang="ts">
	import { profileInitials } from '#lib/profile/display';
	import { cn } from '#lib/utils.js';

	let {
		firstName = '',
		lastName = '',
		email = '',
		src = null,
		class: className = '',
		size = 'md'
	}: {
		firstName?: string;
		lastName?: string;
		email?: string;
		src?: string | null;
		class?: string;
		size?: 'sm' | 'md' | 'lg';
	} = $props();

	const initials = $derived(
		profileInitials({ first_name: firstName, last_name: lastName, email })
	);

	const sizeClass = $derived(
		size === 'lg' ? 'size-20 text-xl' : size === 'sm' ? 'size-9 text-xs' : 'size-12 text-sm'
	);

	let imageFailed = $state(false);

	$effect(() => {
		src;
		imageFailed = false;
	});
</script>

{#if src && !imageFailed}
	<img
		{src}
		alt=""
		class={cn('bg-muted size-full rounded-full object-cover', sizeClass, className)}
		onerror={() => (imageFailed = true)}
	/>
{:else}
	<div
		class={cn(
			'bg-muted text-muted-foreground flex shrink-0 items-center justify-center rounded-full font-medium',
			sizeClass,
			className
		)}
		aria-hidden="true"
	>
		{initials}
	</div>
{/if}
