<script lang="ts">
	import { enhance } from '$app/forms';
	import { accessContact } from '#lib/auth/access';
	import logo from '#lib/assets/elixirpay-logo.png';
	import heroVideo from '#lib/assets/login-hero.mp4';
	import { Button } from '#lib/components/ui/button';
	import { Input } from '#lib/components/ui/input';
	import { Label } from '#lib/components/ui/label';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import Landmark from '@lucide/svelte/icons/landmark';
	import Lock from '@lucide/svelte/icons/lock';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import { toast } from 'svelte-sonner';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	let submitting = $state(false);
	let showPassword = $state(false);
	let heroEl = $state<HTMLVideoElement | null>(null);

	const year = new Date().getFullYear();

	const trustItems = [
		{ title: '256-bit SSL', subtitle: 'Encryption', icon: Lock },
		{ title: 'PCI DSS', subtitle: 'Certified', icon: ShieldCheck },
		{ title: 'RBI Guidelines', subtitle: 'Followed', icon: Landmark }
	] as const;

	$effect(() => {
		const video = heroEl;
		if (!video) return;

		const media = window.matchMedia('(prefers-reduced-motion: reduce)');
		const sync = () => {
			if (media.matches) {
				video.pause();
				return;
			}
			void video.play().catch(() => {
				/* Autoplay can be blocked; muted+playsinline usually allows it. */
			});
		};

		sync();
		media.addEventListener('change', sync);
		return () => media.removeEventListener('change', sync);
	});
</script>

<svelte:head>
	<title>Sign in · ElixirPay</title>
</svelte:head>

<main class="bg-white text-foreground flex min-h-dvh w-full min-w-0 overflow-x-clip dark:bg-background">
	<aside
		class="hidden min-h-dvh w-[52%] bg-white p-4 lg:flex xl:p-5 dark:bg-background"
		aria-hidden="true"
	>
		<div
			class="relative flex min-h-0 w-full flex-1 overflow-hidden rounded-[1.75rem] bg-white shadow-md dark:bg-background"
		>
			<video
				bind:this={heroEl}
				class="absolute inset-0 h-full w-full object-cover object-center"
				src={heroVideo}
				autoplay
				muted
				loop
				playsinline
				preload="auto"
			></video>

			<div
				class="pointer-events-none absolute inset-0 bg-linear-to-t from-[#0a1433]/70 via-transparent to-transparent"
			></div>

			<div class="absolute inset-x-0 bottom-0 z-10 flex justify-center px-5 pb-5 xl:px-7 xl:pb-7">
				<div
					class="trust-pill flex w-fit items-center overflow-hidden rounded-full border border-[#6ea8ff]/45 px-6 py-3.5 shadow-[0_0_24px_rgba(90,150,255,0.22)] backdrop-blur-md"
				>
					{#each trustItems as item, index (item.title)}
						<div
							class="flex items-center gap-3 px-5 {index > 0 ? 'border-l border-white/25' : ''}"
						>
							<item.icon class="size-[1.15rem] shrink-0 text-white" aria-hidden="true" />
							<div class="leading-[1.15] whitespace-nowrap">
								<p class="text-xs font-semibold text-white">{item.title}</p>
								<p class="text-[11px] font-normal text-white/80">{item.subtitle}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</aside>

	<section
		class="relative flex min-h-dvh w-full flex-1 flex-col bg-white px-6 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-10 lg:px-12 xl:px-16 dark:bg-background"
	>
		<div class="mx-auto flex w-full max-w-[24rem] flex-1 flex-col">
			<div class="flex flex-1 flex-col justify-center py-10 sm:py-12">
				<img
					src={logo}
					alt="ElixirPay"
					class="mb-6 h-9 w-auto max-w-46 object-contain object-left sm:h-10"
				/>

				{#if form?.pending}
					<div class="flex flex-col gap-3">
						<h1 class="text-foreground text-[1.75rem] leading-tight font-semibold tracking-tight">
							Profile under approval
						</h1>
						<p class="text-muted-foreground text-sm leading-relaxed">
							Please contact
							<a class="text-primary font-medium hover:underline" href="mailto:{accessContact}"
								>{accessContact}</a
							>.
						</p>
					</div>
				{:else}
					<div class="flex flex-col gap-2">
						<h1 class="text-foreground text-[1.75rem] leading-tight font-semibold tracking-tight">
							Sign in
						</h1>
						<p class="text-muted-foreground text-sm leading-relaxed">
							Enter your login details to access your dashboard.
						</p>
					</div>

					<form
						method="POST"
						action="?/login"
						class="mt-9 flex flex-col gap-6"
						use:enhance={() => {
							submitting = true;
							return async ({ result, update }) => {
								try {
									await update();
									if (result.type === 'failure' && typeof result.data?.error === 'string') {
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
							<Label for="email" class="text-foreground text-sm font-medium">Email</Label>
							<Input
								id="email"
								name="email"
								type="email"
								autocomplete="username"
								inputmode="email"
								autocapitalize="none"
								spellcheck={false}
								required
								placeholder="name@company.com"
								value={form?.email ?? ''}
								aria-invalid={form?.error ? true : undefined}
								aria-describedby={form?.error ? 'login-error' : undefined}
								class="border-border bg-input placeholder:text-muted-foreground/70 h-11 rounded-md"
							/>
						</div>

						<div class="flex flex-col gap-2">
							<Label for="password" class="text-foreground text-sm font-medium">Password</Label>
							<div class="relative">
								<Input
									id="password"
									name="password"
									type={showPassword ? 'text' : 'password'}
									autocomplete="current-password"
									required
									placeholder="Enter Password"
									aria-invalid={form?.error ? true : undefined}
									aria-describedby={form?.error ? 'login-error' : undefined}
									class="border-border bg-input placeholder:text-muted-foreground/70 h-11 rounded-md pr-12"
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

						{#if form?.error}
							<p id="login-error" role="alert" class="text-destructive -mt-2 text-sm">{form.error}</p>
						{/if}

						<p class="text-muted-foreground -mt-2 text-xs leading-relaxed">
							New accounts request access with the temporary password.
						</p>

						<Button
							type="submit"
							class="bg-primary text-primary-foreground hover:bg-primary/90 mt-1 h-11 w-full rounded-md text-sm font-medium"
							disabled={submitting}
						>
							{submitting ? 'Signing in…' : 'Login'}
						</Button>
					</form>
				{/if}
			</div>

			<footer class="text-muted-foreground mt-auto space-y-2 pb-2 text-center text-xs">
				<p>© {year} ElixirPay · Attendance</p>
			</footer>
		</div>
	</section>
</main>

<style>
	.trust-pill {
		background: linear-gradient(
			180deg,
			rgba(28, 58, 140, 0.55) 0%,
			rgba(12, 28, 78, 0.72) 100%
		);
	}
</style>
