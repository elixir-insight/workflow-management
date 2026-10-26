import { defineEnvVars } from '@sveltejs/kit/env';

function required(name: string) {
	return (value: string | undefined) => {
		if (!value) {
			throw new Error(`${name} is required`);
		}

		return value;
	};
}

export const variables = defineEnvVars({
	SUPABASE_URL: {
		static: false,
		description: 'Supabase project URL',
		schema: required('SUPABASE_URL')
	},
	SUPABASE_PUBLISHABLE_KEY: {
		static: false,
		description:
			'Supabase publishable API key. Safe to expose, and kept on the server because sign-in happens there.',
		schema: required('SUPABASE_PUBLISHABLE_KEY')
	}
});
