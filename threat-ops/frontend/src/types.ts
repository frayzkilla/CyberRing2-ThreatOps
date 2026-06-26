export interface Task {
  id: number;
  title: string;
  label: string;
  description: string | null;
  priority: number;
  file_key: string | null;
  comments: string | null;
  status: "pending" | "in_progress" | "confirmed";
  visibility: "public" | "private";
  owner_id: number | null;
  vishing_result: boolean | null;
  osint_comments: string | null;
  report_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecentTaskFeedItem {
  id: number;
  title: string;
  description: string | null;
  comments: string | null;
  label: string;
  status: "pending" | "in_progress" | "confirmed";
  priority: number;
  created_at: string;
}

export interface AuthUser {
  id: number;
  username: string;
  token: string;
  is_admin: boolean;
}

export type TaskStatus = "pending" | "in_progress" | "confirmed";
export type TaskLabel = "p" | string;

export interface CreateTaskPayload {
  title: string;
  label: string;
  description?: string;
  priority: number;
  comments?: string;
  visibility?: "public" | "private";
  file?: File;
}

export interface UpdateStatusPayload {
  status: "in_progress" | "confirmed";
}

export interface PresignedUrlResponse {
  url: string;
}

export interface ServiceStatus {
  name: string;
  online: boolean;
}

export interface DashboardStats {
  total: number;
  pending: number;
  in_progress: number;
  confirmed: number;
  vishing_count: number;
  osint_count: number;
  confirmed_vishing: number;
  threat_level: number;
}
