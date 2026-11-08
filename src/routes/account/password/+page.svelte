<script lang="ts">
	import { enhance } from '$app/forms';
	import logo from '#lib/assets/elixirpay-logo.png';
	import { Button } from '#lib/components/ui/button';
	import { Input } from '#lib/components/ui/input';
	import { Label } from '#lib/components/ui/label';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import { toast } from 'svelte-sonner';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	let submitting = $state(false);
	let showPassword = $state(false);
</script>

<svelte:head>
	<title>Change password · ElixirPay</title>
</svelte:head>

<main
	class="bg-background flex min-h-dvh w-full max-w-full min-w-0 flex-col items-center overflow-x-clip px-6 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]"
>
	<div class="flex w-full max-w-[24rem] flex-1 flex-col justify-center gap-9">
		<img src={logo} alt="ElixirPay" class="h-9 w-auto max-w-46 object-contain" />

		<div class="flex flex-col gap-2">
			<h1 class="text-foreground text-[1.75rem] leading-tight font-semibold tracking-tight">
				Change password
			</h1>
			<p class="text-muted-foreground text-sm leading-relaxed">
				The temporary password has to be replaced before you can continue.
			</p>
		</div>

		<form
			method="POST"
			class="flex flex-col gap-6"
			use:enhance={() => {
				submitting = true;
				return async ({ result, update }) => {
					try {
						await update();
						if (result.type === 'failure' && typeof result.data?.error === 'string') {
							toast.error(result.data.error);
						}
					} finally {
						submitting = false;
					}
				};
			}}
		>
			<div class="flex flex-col gap-2">
				<Label for="password" class="text-foreground text-sm font-medium">New password</Label>
				<div class="relative">
					<Input
						id="password"
						name="password"
						type={showPassword ? 'text' : 'password'}
						autocomplete="new-password"
						required
						minlength={8}
						placeholder="Enter new password"
						aria-invalid={form?.error ? true : undefined}
						aria-describedby={form?.error ? 'password-error' : undefined}
						class="border-border bg-input h-11 rounded-md pr-12"
					/>
					<button
						type="button"
						class="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex w-11 items-center justify-center"
						aria-label={showPassword ? 'Hide password' : 'Show password'}
						aria-pressed={showPassword}
						onclick={() => (showPassword = !showPassword)}
					>
						{#if showPassword}
							<EyeOff class="size-5" />
						{:else}
							<Eye class="size-5" />
						{/if}
					</button>
				</div>
			</div>

			<div class="flex flex-col gap-2">
				<Label for="confirmation" class="text-foreground text-sm font-medium"
					>Confirm password</Label
				>
				<Input
					id="confirmation"
					name="confirmation"
					type={showPassword ? 'text' : 'password'}
					autocomplete="new-password"
					required
					minlength={8}
					placeholder="Confirm password"
					aria-invalid={form?.error ? true : undefined}
					aria-describedby={form?.error ? 'password-error' : undefined}
					class="border-border bg-input h-11 rounded-md"
				/>
			</div>

			{#if form?.error}
				<p id="password-error" role="alert" class="text-destructive -mt-2 text-sm">{form.error}</p>
			{/if}

			<Button
				type="submit"
				class="bg-primary text-primary-foreground hover:bg-primary/90 h-11 w-full rounded-md text-sm font-medium"
				disabled={submitting}
			>
				{submitting ? 'Saving…' : 'Save password'}
			</Button>
		</form>
	</div>
</main>
