import type { AppRole, Database } from '#lib/supabase/database';
import type { SupabaseClient } from '@supabase/supabase-js';

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient<Database>;
			claims: {
				sub: string;
				email?: string;
			} | null;
			profile: {
				role: AppRole;
				mustResetPassword: boolean;
			} | null;
		}
	}
}

export {};
