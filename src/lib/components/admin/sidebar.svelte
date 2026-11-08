<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { isPlatformAdminEmail } from '#lib/auth/platform-admin';
	import { roleLabels } from '#lib/auth/roles';
	import logo from '#lib/assets/elixirpay-logo.png';
	import ThemeToggle from '#lib/components/theme-toggle.svelte';
	import UserAvatar from '#lib/components/user-avatar.svelte';
	import { Button } from '#lib/components/ui/button';
	import { profileDisplayName } from '#lib/profile/display';
	import type { AppRole } from '#lib/supabase/database';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import LogOut from '@lucide/svelte/icons/log-out';
	import ScrollText from '@lucide/svelte/icons/scroll-text';
	import Table from '@lucide/svelte/icons/table';
	import UserRound from '@lucide/svelte/icons/user-round';
	import Users from '@lucide/svelte/icons/users';

	let {
		email,
		role,
		firstName = '',
		lastName = '',
		avatarUrl = null
	}: {
		email: string;
		role: AppRole | null;
		firstName?: string;
		lastName?: string;
		avatarUrl?: string | null;
	} = $props();

	type NavLink = {
		route:
			| '/(app)/admin'
			| '/(app)/admin/users'
			| '/(app)/admin/logs'
			| '/(app)/attendance'
			| '/(app)/timesheet'
			| '/(app)/payroll'
			| '/(app)/user'
			| '/(app)/profile';
		pathname: string;
		label: string;
		icon: typeof LayoutDashboard;
		exact: boolean;
	};

	const primaryLinks = $derived.by(() => {
		const items: NavLink[] = [];

		if (role === 'admin') {
			items.push({
				route: '/(app)/admin',
				pathname: '/admin',
				label: 'Dashboard',
				icon: LayoutDashboard,
				exact: true
			});
		} else if (role === 'payroll') {
			items.push({
				route: '/(app)/payroll',
				pathname: '/payroll',
				label: 'Dashboard',
				icon: LayoutDashboard,
				exact: true
			});
		} else if (role === 'user') {
			items.push({
				route: '/(app)/user',
				pathname: '/user',
				label: 'Dashboard',
				icon: LayoutDashboard,
				exact: true
			});
		}

		if (role === 'admin' || role === 'payroll') {
			items.push(
				{
					route: '/(app)/admin/users',
					pathname: '/admin/users',
					label: 'User management',
					icon: Users,
					exact: false
				},
				{
					route: '/(app)/timesheet',
					pathname: '/timesheet',
					label: 'Timesheet',
					icon: Table,
					exact: false
				}
			);
		}

		if (role === 'admin') {
			items.push({
				route: '/(app)/admin/logs',
				pathname: '/admin/logs',
				label: 'Logs',
				icon: ScrollText,
				exact: false
			});
		}

		if (!isPlatformAdminEmail(email)) {
			items.push({
				route: '/(app)/attendance',
				pathname: '/attendance',
				label: 'Attendance',
				icon: CalendarDays,
				exact: false
			});
		}

		return items;
	});

	const accountLinks = $derived.by(() => {
		const items: NavLink[] = [
			{
				route: '/(app)/profile',
				pathname: '/profile',
				label: 'My profile',
				icon: UserRound,
				exact: true
			}
		];
		return items;
	});

	function isCurrent(pathname: string, exact: boolean) {
		return exact ? page.url.pathname === pathname : page.url.pathname.startsWith(pathname);
	}

	const displayName = $derived(
		profileDisplayName({ first_name: firstName, last_name: lastName, email })
	);

	const homeRoute = $derived(
		role === 'admin'
			? ('/(app)/admin' as const)
			: role === 'payroll'
				? ('/(app)/payroll' as const)
				: role === 'user'
					? ('/(app)/user' as const)
					: ('/(app)/profile' as const)
	);
</script>

<div class="bg-sidebar text-sidebar-foreground flex h-full flex-col">
	<div class="flex items-center gap-3 px-4 pt-5 pb-4">
		<a href={resolve(homeRoute)} class="rounded-xl px-1 py-1 transition-opacity hover:opacity-90">
			<img src={logo} alt="ElixirPay" class="h-8 w-auto max-w-full" />
		</a>
	</div>

	<nav class="flex flex-1 flex-col gap-6 overflow-y-auto px-3 pb-4" aria-label="Main">
		<div class="flex flex-col gap-1">
			<p class="text-muted-foreground px-3 pb-1 text-[11px] font-medium tracking-wide uppercase">
				Workspace
			</p>
			{#each primaryLinks as link (link.route)}
				{@const current = isCurrent(link.pathname, link.exact)}
				<a
					href={resolve(link.route)}
					data-sveltekit-preload-data="hover"
					class={[
						'flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors',
						current
							? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
							: 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
					]}
					aria-current={current ? 'page' : undefined}
				>
					<link.icon class="size-4 shrink-0" aria-hidden="true" />
					{link.label}
				</a>
			{/each}
		</div>

		<div class="flex flex-col gap-1">
			<p class="text-muted-foreground px-3 pb-1 text-[11px] font-medium tracking-wide uppercase">
				Account
			</p>
			{#each accountLinks as link (link.route)}
				{@const current = isCurrent(link.pathname, link.exact)}
				<a
					href={resolve(link.route)}
					data-sveltekit-preload-data="hover"
					class={[
						'flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors',
						current
							? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
							: 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
					]}
					aria-current={current ? 'page' : undefined}
				>
					<link.icon class="size-4 shrink-0" aria-hidden="true" />
					{link.label}
				</a>
			{/each}
		</div>
	</nav>

	<div class="border-sidebar-border mt-auto flex flex-col gap-3 border-t px-3 pt-3 pb-4">
		<ThemeToggle fixed={false} class="h-10 w-full justify-center rounded-xl lg:hidden" />

		<a
			href={resolve('/(app)/profile')}
			class="hover:bg-sidebar-accent flex items-center gap-3 rounded-xl px-2 py-2 transition-colors"
		>
			<UserAvatar
				{firstName}
				{lastName}
				{email}
				src={avatarUrl}
				size="sm"
				class="bg-sidebar-accent text-sidebar-accent-foreground size-9"
			/>
			<div class="min-w-0 flex-1">
				<p class="text-sidebar-foreground truncate text-sm font-medium">{displayName}</p>
				<p class="text-muted-foreground truncate text-xs">
					{role ? roleLabels[role] : 'Employee'}
				</p>
			</div>
		</a>

		<form method="POST" action={resolve('/logout')}>
			<Button type="submit" variant="outline" class="h-10 w-full rounded-xl">
				<LogOut class="size-4" />
				Sign out
			</Button>
		</form>
	</div>
</div>
