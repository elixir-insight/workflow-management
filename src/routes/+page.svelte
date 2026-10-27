<script lang="ts">
	import { enhance } from '$app/forms';
	import { accessContact } from '#lib/auth/access';
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
	<title>Sign in · ElixirPay</title>
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

		{#if form?.pending}
			<Card>
				<CardHeader>
					<h1 class="text-foreground text-2xl font-medium">Profile under approval</h1>
					<CardDescription>
						Please contact
						<a class="text-foreground underline" href="mailto:{accessContact}">{accessContact}</a>.
					</CardDescription>
				</CardHeader>
			</Card>
		{:else}
			<Card>
				<CardHeader>
					<h1 class="text-foreground text-2xl font-medium">Sign in</h1>
					<CardDescription>
						Use an @elixirpay.in or @elixirglobal.com email. New accounts request access with the
						temporary password.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						method="POST"
						action="?/login"
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
									} else if (result.type === 'success' && result.data?.pending) {
										toast.warning('Your profile is under approval.');
									}
								} finally {
									submitting = false;
								}
							};
						}}
					>
						<div class="flex flex-col gap-2">
							<Label for="email">Email</Label>
							<Input
								id="email"
								name="email"
								type="email"
								autocomplete="username"
								inputmode="email"
								autocapitalize="none"
								spellcheck={false}
								required
								value={form?.email ?? ''}
								aria-invalid={form?.error ? true : undefined}
								aria-describedby={form?.error ? 'login-error' : undefined}
								class="h-11"
							/>
						</div>

						<div class="flex flex-col gap-2">
							<Label for="password">Password</Label>
							<div class="relative">
								<Input
									id="password"
									name="password"
									type={showPassword ? 'text' : 'password'}
									autocomplete="current-password"
									required
									aria-invalid={form?.error ? true : undefined}
									aria-describedby={form?.error ? 'login-error' : undefined}
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

						{#if form?.error}
							<p id="login-error" role="alert" class="text-destructive text-sm">{form.error}</p>
						{/if}

						<Button type="submit" class="h-11 w-full" disabled={submitting}>
							{submitting ? 'Signing in…' : 'Sign in'}
						</Button>
					</form>
				</CardContent>
			</Card>
		{/if}
	</div>
</main>
