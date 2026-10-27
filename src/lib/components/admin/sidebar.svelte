<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { isPlatformAdminEmail } from '#lib/auth/platform-admin';
	import { roleLabels } from '#lib/auth/roles';
	import logo from '#lib/assets/elixirpay-logo.png';
	import ThemeToggle from '#lib/components/theme-toggle.svelte';
	import UserAvatar from '#lib/components/user-avatar.svelte';
	import { Button } from '#lib/components/ui/button';
	import { Separator } from '#lib/components/ui/separator';
	import { profileDisplayName } from '#lib/profile/display';
	import type { AppRole } from '#lib/supabase/database';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
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

	const links = $derived.by(() => {
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
				label: 'Home',
				icon: LayoutDashboard,
				exact: true
			});
		} else if (role === 'user') {
			items.push({
				route: '/(app)/user',
				pathname: '/user',
				label: 'Home',
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

		if (!isPlatformAdminEmail(email)) {
			items.push({
				route: '/(app)/attendance',
				pathname: '/attendance',
				label: 'Attendance',
				icon: CalendarDays,
				exact: false
			});
		}

		items.push({
			route: '/(app)/profile',
			pathname: '/profile',
			label: 'My profile',
			icon: UserRound,
			exact: true
		});

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
	<div class="flex items-center gap-3 px-4 py-4">
		<a
			href={resolve(homeRoute)}
			class="bg-primary-foreground dark:bg-foreground rounded-lg px-2 py-1.5"
		>
			<img src={logo} alt="ElixirPay" class="h-7 w-auto max-w-full" />
		</a>
	</div>

	<nav class="flex flex-1 flex-col gap-1 px-3" aria-label="Main">
		{#each links as link (link.route)}
			{@const current = isCurrent(link.pathname, link.exact)}
			<a
				href={resolve(link.route)}
				class="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors {current
					? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground'
					: 'text-sidebar-foreground'}"
				aria-current={current ? 'page' : undefined}
			>
				<link.icon class="size-4 shrink-0" aria-hidden="true" />
				{link.label}
			</a>
		{/each}
	</nav>

	<div class="flex flex-col gap-3 px-3 pb-4">
		<ThemeToggle fixed={false} class="w-full justify-center" />
		<Separator />
		<div class="flex items-center gap-3 px-1">
			<UserAvatar
				{firstName}
				{lastName}
				{email}
				src={avatarUrl}
				size="sm"
				class="bg-sidebar-accent text-sidebar-accent-foreground"
			/>
			<div class="min-w-0 flex-1">
				<p class="text-sidebar-foreground truncate text-sm font-medium">{displayName}</p>
				<p class="text-muted-foreground truncate text-xs">
					{role ? roleLabels[role] : 'User'}
					{#if email}
						· {email}
					{/if}
				</p>
			</div>
		</div>
		<form method="POST" action={resolve('/logout')}>
			<Button type="submit" variant="outline" class="h-10 w-full">Sign out</Button>
		</form>
	</div>
</div>
