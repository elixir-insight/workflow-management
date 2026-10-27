<script lang="ts">
	import UserDashboard from '#lib/components/dashboard/user-dashboard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Dashboard · ElixirPay</title>
</svelte:head>

{#if data.session}
	<UserDashboard
		data={data.dashboard}
		email={data.session.email}
		firstName={data.session.firstName}
		lastName={data.session.lastName}
	/>
{:else}
	<UserDashboard data={data.dashboard} />
{/if}
