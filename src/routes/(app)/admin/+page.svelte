<script lang="ts">
	import OrgSummary from '#lib/components/dashboard/org-summary.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Dashboard · ElixirPay</title>
</svelte:head>

<OrgSummary
	org={data.org}
	personal={data.personal}
	showAttendance={data.showAttendance}
	greeting="People, access, and today’s attendance coverage."
/>
