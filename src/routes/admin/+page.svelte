<script lang="ts">
	import RoleHome from '#lib/components/role-home.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Admin · ElixirPay</title>
</svelte:head>

{#if data.session}
	<RoleHome role="admin" email={data.session.email} />
{/if}
