<script lang="ts">
	import { Button } from '#lib/components/ui/button';
	import Copy from '@lucide/svelte/icons/copy';
	import X from '@lucide/svelte/icons/x';
	import { toast } from 'svelte-sonner';

	let {
		open = $bindable(false),
		title = 'Mail draft',
		description = '',
		toAddress = '[reporting-lead@company.com]',
		body = ''
	}: {
		open?: boolean;
		title?: string;
		description?: string;
		toAddress?: string;
		body?: string;
	} = $props();

	let copied = $state(false);

	async function copyBody() {
		try {
			await navigator.clipboard.writeText(body);
			copied = true;
			toast.success('Mail draft copied.');
			setTimeout(() => (copied = false), 2000);
		} catch {
			toast.error('Could not copy. Select the text and copy manually.');
		}
	}

	function close() {
		open = false;
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
		<button
			type="button"
			class="absolute inset-0 bg-black/40"
			aria-label="Close mail draft"
			onclick={close}
		></button>

		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="mail-draft-title"
			class="border-border bg-card relative z-10 flex max-h-[85dvh] w-full max-w-lg flex-col overflow-hidden rounded-xl border shadow-lg"
		>
			<div class="flex items-start justify-between gap-3 border-b px-4 py-3">
				<div class="min-w-0">
					<h2 id="mail-draft-title" class="text-foreground text-base font-medium">{title}</h2>
					{#if description}
						<p class="text-muted-foreground mt-1 text-sm">{description}</p>
					{/if}
				</div>
				<Button type="button" variant="outline" size="icon" aria-label="Close" onclick={close}>
					<X class="size-4" />
				</Button>
			</div>

			<div class="flex flex-col gap-3 overflow-auto p-4">
				<div class="border-border rounded-lg border px-3 py-2">
					<p class="text-muted-foreground text-xs">To</p>
					<p class="text-foreground text-sm break-all">{toAddress}</p>
				</div>

				<pre
					class="border-border bg-muted/40 text-foreground max-h-72 overflow-auto rounded-lg border p-3 text-sm whitespace-pre-wrap"
				>{body}</pre>
			</div>

			<div class="flex flex-wrap gap-2 border-t px-4 py-3">
				<Button type="button" class="h-10 flex-1" onclick={copyBody}>
					<Copy class="size-4" />
					{copied ? 'Copied' : 'Copy mail text'}
				</Button>
				<Button type="button" variant="outline" class="h-10" onclick={close}>Done</Button>
			</div>
		</div>
	</div>
{/if}
