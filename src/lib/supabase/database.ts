export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	__InternalSupabase: {
		PostgrestVersion: '14.18';
	};
	public: {
		Tables: {
			profiles: {
				Row: {
					casual_leave: number;
					created_at: string;
					designation: string;
					earned_leave: number;
					email: string;
					id: string;
					must_reset_password: boolean;
					reports_to: string | null;
					role: Database['public']['Enums']['app_role'] | null;
					sick_leave: number;
					status: Database['public']['Enums']['access_status'];
				};
				Insert: {
					casual_leave?: number;
					created_at?: string;
					designation?: string;
					earned_leave?: number;
					email?: string;
					id: string;
					must_reset_password?: boolean;
					reports_to?: string | null;
					role?: Database['public']['Enums']['app_role'] | null;
					sick_leave?: number;
					status?: Database['public']['Enums']['access_status'];
				};
				Update: {
					casual_leave?: number;
					created_at?: string;
					designation?: string;
					earned_leave?: number;
					email?: string;
					id?: string;
					must_reset_password?: boolean;
					reports_to?: string | null;
					role?: Database['public']['Enums']['app_role'] | null;
					sick_leave?: number;
					status?: Database['public']['Enums']['access_status'];
				};
				Relationships: [];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			approve_profile: {
				Args: {
					next_casual: number;
					next_designation: string;
					next_earned: number;
					next_reports_to: string | null;
					next_role: string;
					next_sick: number;
					target: string;
				};
				Returns: undefined;
			};
		};
		Enums: {
			access_status: 'pending' | 'approved';
			app_role: 'admin' | 'payroll' | 'user';
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

export type AppRole = Database['public']['Enums']['app_role'];
