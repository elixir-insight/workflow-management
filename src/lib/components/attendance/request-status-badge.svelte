<script lang="ts">
	import { requestStatusLabels, type RequestStatus } from '#lib/attendance/status';
	import { cn } from '#lib/utils.js';

	let {
		status,
		class: className = ''
	}: {
		status: RequestStatus;
		class?: string;
	} = $props();

	const tone = $derived(
		status === 'approved'
			? 'bg-success/15 text-success'
			: status === 'rejected'
				? 'bg-destructive/10 text-destructive'
				: 'bg-amber/20 text-foreground'
	);
</script>

<span
	class={cn(
		'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
		tone,
		className
	)}
>
	{requestStatusLabels[status]}
</span>
