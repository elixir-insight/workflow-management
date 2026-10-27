<script lang="ts">
	import { enhance } from '$app/forms';
	import logo from '#lib/assets/elixirpay-logo.png';
	import { Button } from '#lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader } from '#lib/components/ui/card';
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
	class="bg-background flex min-h-dvh flex-col items-center px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]"
>
	<div class="flex w-full max-w-sm flex-1 flex-col justify-center gap-6">
		<div class="flex flex-col items-center gap-2">
			<div class="bg-primary-foreground dark:bg-foreground rounded-lg px-3 py-2">
				<img src={logo} alt="ElixirPay" class="h-14 w-auto max-w-full" />
			</div>
			<p class="text-muted-foreground text-sm">Attendance</p>
		</div>

		<Card>
			<CardHeader>
				<h1 class="text-foreground text-2xl font-medium">Change password</h1>
				<CardDescription>
					The temporary password has to be replaced before you can continue.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					method="POST"
					class="flex flex-col gap-5"
					use:enhance={() => {
						submitting = true;
						return async ({ result, update }) => {
							try {
								await update();
								if (
									result.type === 'failure' &&
									typeof result.data?.error === 'string'
								) {
									toast.error(result.data.error);
								}
							} finally {
								submitting = false;
							}
						};
					}}
				>
					<div class="flex flex-col gap-2">
						<Label for="password">New password</Label>
						<div class="relative">
							<Input
								id="password"
								name="password"
								type={showPassword ? 'text' : 'password'}
								autocomplete="new-password"
								required
								minlength={8}
								aria-invalid={form?.error ? true : undefined}
								aria-describedby={form?.error ? 'password-error' : undefined}
								class="h-11 pr-12"
							/>
							<button
								type="button"
								class="text-foreground absolute inset-y-0 right-0 flex w-11 items-center justify-center"
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
						<Label for="confirmation">Confirm password</Label>
						<Input
							id="confirmation"
							name="confirmation"
							type={showPassword ? 'text' : 'password'}
							autocomplete="new-password"
							required
							minlength={8}
							aria-invalid={form?.error ? true : undefined}
							aria-describedby={form?.error ? 'password-error' : undefined}
							class="h-11"
						/>
					</div>

					{#if form?.error}
						<p id="password-error" role="alert" class="text-destructive text-sm">{form.error}</p>
					{/if}

					<Button type="submit" class="h-11 w-full" disabled={submitting}>
						{submitting ? 'Saving…' : 'Save password'}
					</Button>
				</form>

				<form method="POST" action="/logout" class="mt-3">
					<Button type="submit" variant="outline" class="h-11 w-full">Sign out</Button>
				</form>
			</CardContent>
		</Card>
	</div>
</main>
