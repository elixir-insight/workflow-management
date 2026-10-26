export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	__InternalSupabase: {
		PostgrestVersion: '14.18';
	};
	public: {
		Tables: {
			profiles: {
				Row: {
					created_at: string;
					id: string;
					must_reset_password: boolean;
					role: Database['public']['Enums']['app_role'];
				};
				Insert: {
					created_at?: string;
					id: string;
					must_reset_password?: boolean;
					role: Database['public']['Enums']['app_role'];
				};
				Update: {
					created_at?: string;
					id?: string;
					must_reset_password?: boolean;
					role?: Database['public']['Enums']['app_role'];
				};
				Relationships: [];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			[_ in never]: never;
		};
		Enums: {
			app_role: 'employee' | 'admin' | 'hr';
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

export type AppRole = Database['public']['Enums']['app_role'];
