export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	__InternalSupabase: {
		PostgrestVersion: '14.18';
	};
	public: {
		Tables: {
			attendance_days: {
				Row: {
					created_at: string;
					id: string;
					in_time: string | null;
					out_time: string | null;
					updated_at: string;
					user_id: string;
					work_date: string;
				};
				Insert: {
					created_at?: string;
					id?: string;
					in_time?: string | null;
					out_time?: string | null;
					updated_at?: string;
					user_id: string;
					work_date: string;
				};
				Update: {
					created_at?: string;
					id?: string;
					in_time?: string | null;
					out_time?: string | null;
					updated_at?: string;
					user_id?: string;
					work_date?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'attendance_days_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			audit_logs: {
				Row: {
					action: string;
					actor_email: string;
					actor_id: string | null;
					changes: Json;
					created_at: string;
					entity_id: string | null;
					entity_label: string;
					entity_type: string;
					id: string;
					summary: string;
				};
				Insert: {
					action: string;
					actor_email?: string;
					actor_id?: string | null;
					changes?: Json;
					created_at?: string;
					entity_id?: string | null;
					entity_label?: string;
					entity_type: string;
					id?: string;
					summary: string;
				};
				Update: {
					action?: string;
					actor_email?: string;
					actor_id?: string | null;
					changes?: Json;
					created_at?: string;
					entity_id?: string | null;
					entity_label?: string;
					entity_type?: string;
					id?: string;
					summary?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'audit_logs_actor_id_fkey';
						columns: ['actor_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			leave_requests: {
				Row: {
					approver_id: string | null;
					created_at: string;
					day_count: number;
					decided_at: string | null;
					decided_by: string | null;
					email_body: string;
					end_date: string;
					id: string;
					leave_kind: Database['public']['Enums']['leave_kind'];
					reason: string;
					start_date: string;
					status: Database['public']['Enums']['request_status'];
					updated_at: string;
					user_id: string;
				};
				Insert: {
					approver_id?: string | null;
					created_at?: string;
					day_count: number;
					decided_at?: string | null;
					decided_by?: string | null;
					email_body?: string;
					end_date: string;
					id?: string;
					leave_kind: Database['public']['Enums']['leave_kind'];
					reason?: string;
					start_date: string;
					status?: Database['public']['Enums']['request_status'];
					updated_at?: string;
					user_id: string;
				};
				Update: {
					approver_id?: string | null;
					created_at?: string;
					day_count?: number;
					decided_at?: string | null;
					decided_by?: string | null;
					email_body?: string;
					end_date?: string;
					id?: string;
					leave_kind?: Database['public']['Enums']['leave_kind'];
					reason?: string;
					start_date?: string;
					status?: Database['public']['Enums']['request_status'];
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'leave_requests_approver_id_fkey';
						columns: ['approver_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'leave_requests_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			profiles: {
				Row: {
					avatar_path: string | null;
					casual_leave: number;
					created_at: string;
					designation: string;
					earned_leave: number;
					email: string;
					employee_id: string | null;
					first_name: string;
					id: string;
					last_name: string;
					must_reset_password: boolean;
					phone: string;
					present_address: string;
					reports_to: string | null;
					role: Database['public']['Enums']['app_role'] | null;
					status: Database['public']['Enums']['access_status'];
					updated_at: string;
					vertical_id: string | null;
				};
				Insert: {
					avatar_path?: string | null;
					casual_leave?: number;
					created_at?: string;
					designation?: string;
					earned_leave?: number;
					email?: string;
					employee_id?: string | null;
					first_name?: string;
					id: string;
					last_name?: string;
					must_reset_password?: boolean;
					phone?: string;
					present_address?: string;
					reports_to?: string | null;
					role?: Database['public']['Enums']['app_role'] | null;
					status?: Database['public']['Enums']['access_status'];
					updated_at?: string;
					vertical_id?: string | null;
				};
				Update: {
					avatar_path?: string | null;
					casual_leave?: number;
					created_at?: string;
					designation?: string;
					earned_leave?: number;
					email?: string;
					employee_id?: string | null;
					first_name?: string;
					id?: string;
					last_name?: string;
					must_reset_password?: boolean;
					phone?: string;
					present_address?: string;
					reports_to?: string | null;
					role?: Database['public']['Enums']['app_role'] | null;
					status?: Database['public']['Enums']['access_status'];
					updated_at?: string;
					vertical_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'profiles_reports_to_fkey';
						columns: ['reports_to'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'profiles_vertical_id_fkey';
						columns: ['vertical_id'];
						isOneToOne: false;
						referencedRelation: 'verticals';
						referencedColumns: ['id'];
					}
				];
			};
			verticals: {
				Row: {
					created_at: string;
					id: string;
					name: string;
				};
				Insert: {
					created_at?: string;
					id?: string;
					name: string;
				};
				Update: {
					created_at?: string;
					id?: string;
					name?: string;
				};
				Relationships: [];
			};
			wfh_requests: {
				Row: {
					approver_id: string | null;
					created_at: string;
					decided_at: string | null;
					decided_by: string | null;
					id: string;
					reason: string;
					status: Database['public']['Enums']['request_status'];
					updated_at: string;
					user_id: string;
					work_date: string;
				};
				Insert: {
					approver_id?: string | null;
					created_at?: string;
					decided_at?: string | null;
					decided_by?: string | null;
					id?: string;
					reason?: string;
					status?: Database['public']['Enums']['request_status'];
					updated_at?: string;
					user_id: string;
					work_date: string;
				};
				Update: {
					approver_id?: string | null;
					created_at?: string;
					decided_at?: string | null;
					decided_by?: string | null;
					id?: string;
					reason?: string;
					status?: Database['public']['Enums']['request_status'];
					updated_at?: string;
					user_id?: string;
					work_date?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'wfh_requests_approver_id_fkey';
						columns: ['approver_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'wfh_requests_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			apply_leave_request: {
				Args: {
					next_day_count: number;
					next_email_body: string;
					next_end_date: string;
					next_leave_kind: string;
					next_reason: string;
					next_start_date: string;
				};
				Returns: string;
			};
			apply_wfh_request: {
				Args: {
					next_reason: string;
					next_work_date: string;
				};
				Returns: string;
			};
			decide_leave_request: {
				Args: {
					next_status: string;
					target: string;
				};
				Returns: undefined;
			};
			decide_wfh_request: {
				Args: {
					next_status: string;
					target: string;
				};
				Returns: undefined;
			};
			delete_user: {
				Args: {
					target: string;
				};
				Returns: undefined;
			};
			manage_profile: {
				Args: {
					next_casual: number | null;
					next_designation: string | null;
					next_earned: number | null;
					next_employee_id?: string | null;
					next_reports_to: string | null;
					next_role: string | null;
					next_status: string;
					next_vertical_id: string | null;
					target: string;
				};
				Returns: undefined;
			};
			update_leave_balances: {
				Args: {
					next_casual: number;
					next_earned: number;
					target: string;
				};
				Returns: undefined;
			};
			update_my_profile: {
				Args: {
					next_avatar_path?: string | null;
					next_first_name: string;
					next_last_name: string;
					next_phone: string;
					next_present_address: string;
				};
				Returns: undefined;
			};
			upsert_attendance_day: {
				Args: {
					next_in_time?: string | null;
					next_out_time?: string | null;
					next_work_date: string;
				};
				Returns: string;
			};
		};
		Enums: {
			access_status: 'pending' | 'approved' | 'denied';
			app_role: 'admin' | 'payroll' | 'user';
			leave_kind: 'casual' | 'earned';
			request_status: 'pending' | 'approved' | 'rejected';
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

export type AppRole = Database['public']['Enums']['app_role'];
export type AccessStatus = Database['public']['Enums']['access_status'];
export type LeaveKind = Database['public']['Enums']['leave_kind'];
export type RequestStatus = Database['public']['Enums']['request_status'];
