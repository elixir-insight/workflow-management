<script lang="ts">
	import { accessStatusDotClass } from '#lib/auth/status';
	import type { AccessStatus } from '#lib/supabase/database';
	import type { HTMLAttributes } from 'svelte/elements';

	type Tone = AccessStatus | 'success' | 'amber' | 'orange';

	let {
		status,
		class: className = '',
		...rest
	}: {
		status: Tone;
		class?: string;
	} & HTMLAttributes<HTMLSpanElement> = $props();

	const toneClass = $derived(
		status === 'success'
			? 'bg-success'
			: status === 'amber'
				? 'bg-amber'
				: status === 'orange'
					? 'bg-orange'
					: accessStatusDotClass[status]
	);
</script>

<span
	class="inline-block size-2 shrink-0 rounded-full {toneClass} {className}"
	aria-hidden="true"
	{...rest}
></span>
