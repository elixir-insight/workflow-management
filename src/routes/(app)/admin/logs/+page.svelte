<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		auditActionLabel,
		auditFieldLabel,
		formatAuditValue
	} from '#lib/audit/labels';
	import { Button } from '#lib/components/ui/button';
	import { Input } from '#lib/components/ui/input';
	import UserAvatar from '#lib/components/user-avatar.svelte';
	import type { Json } from '#lib/supabase/database';
	import Search from '@lucide/svelte/icons/search';
	import type { PageProps } from './$types';
	import type { LogCategory } from './+page.server';

	let { data }: PageProps = $props();

	let query = $state('');

	const filters = [
		{ id: 'all', label: 'All' },
		{ id: 'profile', label: 'People' },
		{ id: 'leave', label: 'Leave' },
		{ id: 'wfh', label: 'WFH' },
		{ id: 'attendance', label: 'Attendance' },
		{ id: 'vertical', label: 'Verticals' }
	] as const satisfies ReadonlyArray<{ id: LogCategory; label: string }>;

	const totalPages = $derived(Math.max(1, Math.ceil(data.total / data.pageSize)));
	const normalizedQuery = $derived(query.trim().toLowerCase());

	const filteredLogs = $derived(
		data.logs.filter((log) => {
			if (!normalizedQuery) return true;
			const haystack = [
				log.actor_email,
				log.summary,
				log.entity_label,
				log.action,
				auditActionLabel(log.action)
			]
				.filter(Boolean)
				.join(' ')
				.toLowerCase();
			return haystack.includes(normalizedQuery);
		})
	);

	const groupedLogs = $derived(
		filteredLogs.reduce<Array<{ key: string; label: string; items: typeof filteredLogs }>>(
			(groups, log) => {
				const key = dayKey(log.created_at);
				const existing = groups.find((group) => group.key === key);
				if (existing) {
					existing.items.push(log);
					return groups;
				}
				groups.push({ key, label: dayLabel(log.created_at), items: [log] });
				return groups;
			},
			[]
		)
	);

	function logsHref(next: { page?: number; category?: LogCategory }) {
		const params = new URLSearchParams();
		const page = next.page ?? data.page;
		const category = next.category ?? data.category;
		if (page > 1) params.set('page', String(page));
		if (category !== 'all') params.set('category', category);
		const qs = params.toString();
		return resolve('/(app)/admin/logs') + (qs ? `?${qs}` : '');
	}

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

	function formatTime(iso: string) {
		const date = new Date(iso);
		if (Number.isNaN(date.getTime())) return iso;
		return date.toLocaleTimeString('en-IN', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function dayKey(iso: string) {
		const date = new Date(iso);
		if (Number.isNaN(date.getTime())) return iso;
		return date.toLocaleDateString('en-CA');
	}

	function dayLabel(iso: string) {
		const date = new Date(iso);
		if (Number.isNaN(date.getTime())) return iso;

		const today = new Date();
		const yesterday = new Date();
		yesterday.setDate(today.getDate() - 1);

		const sameDay = (a: Date, b: Date) =>
			a.getFullYear() === b.getFullYear() &&
			a.getMonth() === b.getMonth() &&
			a.getDate() === b.getDate();

		if (sameDay(date, today)) return 'Today';
		if (sameDay(date, yesterday)) return 'Yesterday';

		return date.toLocaleDateString('en-IN', {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	function actionTone(action: string) {
		if (action.endsWith('.delete')) return 'bg-rose-500/10 text-rose-700 dark:text-rose-300';
		if (action.endsWith('.create')) return 'bg-success/15 text-success';
		if (action.includes('decide')) return 'bg-amber/15 text-amber';
		return 'bg-muted text-muted-foreground';
	}
</script>

<svelte:head>
	<title>Logs · ElixirPay</title>
</svelte:head>

<div class="flex w-full max-w-full min-w-0 flex-col gap-5 lg:gap-6">
	<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
		<div class="flex min-w-0 flex-col gap-1">
			<p class="text-muted-foreground text-sm leading-relaxed">
				Who changed what — roles, leave balances, designations, access, and more.
			</p>
		</div>

		<label class="relative block w-full lg:max-w-sm">
			<span class="sr-only">Search logs</span>
			<Search
				class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
				aria-hidden="true"
			/>
			<Input
				type="search"
				bind:value={query}
				placeholder="Search actor, action, or entity"
				class="bg-muted/40 h-11 rounded-xl border-transparent pr-3 pl-10 shadow-none"
			/>
		</label>
	</div>

	<div
		class="scroll-x-contain flex gap-2 pb-0.5 lg:overflow-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
	>
		{#each filters as filter (filter.id)}
			<a
				href={logsHref({ category: filter.id, page: 1 })}
				class={[
					'inline-flex h-9 shrink-0 items-center rounded-full px-3.5 text-sm font-medium transition-colors',
					data.category === filter.id
						? 'bg-foreground text-background'
						: 'bg-muted text-muted-foreground hover:text-foreground'
				]}
				aria-current={data.category === filter.id ? 'page' : undefined}
			>
				{filter.label}
			</a>
		{/each}
	</div>

	{#if data.loadError}
		<p role="alert" class="text-destructive text-sm">{data.loadError}</p>
	{:else if data.logs.length === 0}
		<div
			class="border-border bg-muted/20 text-muted-foreground rounded-2xl border border-dashed px-4 py-12 text-center text-sm"
		>
			No activity logged yet{data.category === 'all' ? '' : ' in this category'}.
		</div>
	{:else if filteredLogs.length === 0}
		<div
			class="border-border bg-muted/20 text-muted-foreground rounded-2xl border border-dashed px-4 py-12 text-center text-sm"
		>
			No logs match “{query.trim()}”.
		</div>
	{:else}
		<div class="flex items-baseline justify-between gap-3 px-0.5">
			<h2 class="text-muted-foreground text-xs font-medium tracking-wide uppercase">Activity</h2>
			<p class="text-muted-foreground text-xs">
				{data.total} event{data.total === 1 ? '' : 's'}
				{#if normalizedQuery}
					· {filteredLogs.length} on this page
				{/if}
			</p>
		</div>

		<!-- Mobile: date-grouped cards (Discord / Google Home / SmartThings) -->
		<div class="flex flex-col gap-5 lg:hidden">
			{#each groupedLogs as group (group.key)}
				<section class="flex flex-col gap-2">
					<div class="flex items-baseline justify-between gap-3 px-0.5">
						<h3 class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
							{group.label}
						</h3>
						<p class="text-muted-foreground text-xs">{group.items.length}</p>
					</div>
					<ul class="border-border divide-border overflow-hidden rounded-2xl border divide-y">
						{#each group.items as log (log.id)}
							{@const changes = changeEntries(log.changes)}
							<li class="px-3.5 py-3.5">
								<div class="flex items-start gap-3">
									<UserAvatar email={log.actor_email ?? ''} size="sm" class="size-10 shrink-0 text-sm" />
									<div class="min-w-0 flex-1">
										<div class="flex items-start justify-between gap-2">
											<div class="min-w-0">
												<p class="text-foreground font-medium">
													{auditActionLabel(log.action)}
												</p>
												<p class="text-muted-foreground mt-0.5 text-sm">
													{log.summary}
												</p>
											</div>
											<p class="text-muted-foreground shrink-0 text-xs tabular-nums">
												{formatTime(log.created_at)}
											</p>
										</div>
										<p class="text-muted-foreground mt-2 text-xs">
											{log.actor_email || 'System'}
											{#if log.entity_label}
												· {log.entity_label}
											{/if}
										</p>
										{#if changes.length > 0}
											<ul class="mt-2.5 flex flex-col gap-1">
												{#each changes as change (change.field)}
													<li class="text-muted-foreground text-xs leading-relaxed">
														<span class="text-foreground font-medium"
															>{auditFieldLabel(change.field)}</span
														>
														<span class="text-muted-foreground/80">
															{formatAuditValue(change.from)} → {formatAuditValue(change.to)}
														</span>
													</li>
												{/each}
											</ul>
										{/if}
									</div>
								</div>
							</li>
						{/each}
					</ul>
				</section>
			{/each}
		</div>

		<!-- Desktop: audit table (PlanetScale / Vanta / Circle / Front) -->
		<div class="border-border hidden overflow-hidden rounded-2xl border lg:block">
			<div
				class="text-muted-foreground border-border bg-muted/30 grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.1fr)_minmax(0,1fr)_9.5rem] gap-4 border-b px-4 py-2.5 text-xs font-medium tracking-wide uppercase"
				aria-hidden="true"
			>
				<span>Event</span>
				<span>Actor</span>
				<span>Entity</span>
				<span>When</span>
			</div>

			<ul class="divide-border divide-y">
				{#each filteredLogs as log (log.id)}
					{@const changes = changeEntries(log.changes)}
					<li class="hover:bg-muted/30 px-4 py-3.5 transition-colors">
						<div
							class="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.1fr)_minmax(0,1fr)_9.5rem] items-start gap-4"
						>
							<div class="min-w-0">
								<div class="flex flex-wrap items-center gap-2">
									<span
										class="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium {actionTone(
											log.action
										)}"
									>
										{auditActionLabel(log.action)}
									</span>
								</div>
								<p class="text-muted-foreground mt-1.5 text-sm leading-relaxed">{log.summary}</p>
								{#if changes.length > 0}
									<ul class="mt-2 flex flex-col gap-1">
										{#each changes as change (change.field)}
											<li class="text-muted-foreground text-xs">
												<span class="text-foreground font-medium"
													>{auditFieldLabel(change.field)}</span
												>
												: {formatAuditValue(change.from)} → {formatAuditValue(change.to)}
											</li>
										{/each}
									</ul>
								{/if}
							</div>

							<div class="flex min-w-0 items-center gap-2.5">
								<UserAvatar
									email={log.actor_email ?? ''}
									size="sm"
									class="size-8 shrink-0 text-xs"
								/>
								<span class="text-foreground truncate text-sm">
									{log.actor_email || 'System'}
								</span>
							</div>

							<p class="text-muted-foreground truncate text-sm">
								{log.entity_label || '—'}
							</p>

							<p class="text-muted-foreground text-sm tabular-nums">
								{formatWhen(log.created_at)}
							</p>
						</div>
					</li>
				{/each}
			</ul>
		</div>

		{#if totalPages > 1}
			<div class="flex items-center justify-between gap-3 px-0.5">
				<p class="text-muted-foreground text-xs">
					Page {data.page} of {totalPages}
				</p>
				<div class="flex gap-2">
					{#if data.page > 1}
						<Button href={logsHref({ page: data.page - 1 })} variant="outline" size="sm" class="rounded-xl">
							Previous
						</Button>
					{/if}
					{#if data.page < totalPages}
						<Button href={logsHref({ page: data.page + 1 })} variant="outline" size="sm" class="rounded-xl">
							Next
						</Button>
					{/if}
				</div>
			</div>
		{/if}
	{/if}
</div>
