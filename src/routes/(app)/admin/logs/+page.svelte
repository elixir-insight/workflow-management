<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		auditActionLabel,
		auditFieldLabel,
		formatAuditValue
	} from '#lib/audit/labels';
	import { Button } from '#lib/components/ui/button';
	import type { Json } from '#lib/supabase/database';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const totalPages = $derived(Math.max(1, Math.ceil(data.total / data.pageSize)));

	function changeEntries(changes: Json) {
		if (!changes || typeof changes !== 'object' || Array.isArray(changes)) return [];
		return Object.entries(changes as Record<string, Json>).map(([field, value]) => {
			const entry =
				value && typeof value === 'object' && !Array.isArray(value)
					? (value as Record<string, Json>)
					: {};
			return {
				field,
				from: entry.from,
				to: entry.to
			};
		});
	}

	function formatWhen(iso: string) {
		const date = new Date(iso);
		if (Number.isNaN(date.getTime())) return iso;
		return date.toLocaleString('en-IN', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>Logs · ElixirPay</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<div>
		<p class="text-muted-foreground text-sm">
			Who changed what — roles, leave balances, designations, access, and more.
		</p>
	</div>

	{#if data.loadError}
		<p role="alert" class="text-destructive text-sm">{data.loadError}</p>
	{/if}

	{#if data.logs.length === 0 && !data.loadError}
		<p class="text-muted-foreground text-sm">No activity logged yet.</p>
	{:else}
		<ul class="flex flex-col gap-3">
			{#each data.logs as log (log.id)}
				{@const changes = changeEntries(log.changes)}
				<li class="border-border rounded-xl border p-4">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div class="min-w-0">
							<p class="text-foreground text-sm font-medium">{auditActionLabel(log.action)}</p>
							<p class="text-muted-foreground mt-1 text-sm">{log.summary}</p>
						</div>
						<p class="text-muted-foreground shrink-0 text-xs">{formatWhen(log.created_at)}</p>
					</div>

					<p class="text-muted-foreground mt-3 text-xs">
						By {log.actor_email || 'System'}
						{#if log.entity_label}
							· on {log.entity_label}
						{/if}
					</p>

					{#if changes.length > 0}
						<ul class="mt-3 flex flex-col gap-1.5">
							{#each changes as change (change.field)}
								<li class="text-muted-foreground text-xs">
									<span class="text-foreground font-medium">{auditFieldLabel(change.field)}</span>
									:
									{formatAuditValue(change.from)} → {formatAuditValue(change.to)}
								</li>
							{/each}
						</ul>
					{/if}
				</li>
			{/each}
		</ul>

		{#if totalPages > 1}
			<div class="flex items-center justify-between gap-3">
				<p class="text-muted-foreground text-xs">
					Page {data.page} of {totalPages} · {data.total} events
				</p>
				<div class="flex gap-2">
					{#if data.page > 1}
						<Button
							href={resolve('/(app)/admin/logs') + `?page=${data.page - 1}`}
							variant="outline"
							size="sm"
						>
							Previous
						</Button>
					{/if}
					{#if data.page < totalPages}
						<Button
							href={resolve('/(app)/admin/logs') + `?page=${data.page + 1}`}
							variant="outline"
							size="sm"
						>
							Next
						</Button>
					{/if}
				</div>
			</div>
		{/if}
	{/if}
</div>
