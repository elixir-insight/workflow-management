<script lang="ts">
	import PayrollDashboard from '#lib/components/dashboard/payroll-dashboard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Payroll dashboard · ElixirPay</title>
</svelte:head>

<PayrollDashboard data={data.dashboard} showAttendance={data.showAttendance} />
