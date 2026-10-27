<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { Toaster } from '#lib/components/ui/sonner';
	import type { FlashToast } from '#lib/server/flash';

	let { flash = null }: { flash?: FlashToast | null } = $props();

	let shownId = $state<string | null>(null);

	$effect(() => {
		if (!flash || flash.id === shownId) return;

		shownId = flash.id;

		switch (flash.type) {
			case 'success':
				toast.success(flash.message);
				break;
			case 'error':
				toast.error(flash.message);
				break;
			case 'warning':
				toast.warning(flash.message);
				break;
			case 'info':
				toast.info(flash.message);
				break;
		}
	});
</script>

<Toaster position="top-center" richColors closeButton />
