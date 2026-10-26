<script lang="ts">
	import RoleHome from '#lib/components/role-home.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Payroll · ElixirPay</title>
</svelte:head>

{#if data.session}
	<RoleHome role="payroll" email={data.session.email} />
{/if}
