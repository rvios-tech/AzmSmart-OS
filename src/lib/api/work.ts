import { apiFetch } from "./client";

/* ───────── أنواع مشتركة ───────── */

export interface Person {
  id: string;
  name: string;
  avatar: string | null;
}

export const PROJECT_STATUS_LABELS = ["على المسار", "في خطر", "متأخر", "مكتمل"] as const;
export type ProjectStatusLabel = (typeof PROJECT_STATUS_LABELS)[number];

export const TASK_STATUS_LABELS = ["متراكم", "للتنفيذ", "قيد التنفيذ", "قيد المراجعة", "مكتمل"] as const;
export type TaskStatusLabel = (typeof TASK_STATUS_LABELS)[number];

export const TASK_PRIORITY_LABELS = ["منخفضة", "متوسطة", "عالية", "عاجلة"] as const;
export type TaskPriorityLabel = (typeof TASK_PRIORITY_LABELS)[number];

/* ───────── المشاريع ───────── */

export interface Milestone {
  id: string;
  title: string;
  date: string;
  done: boolean;
}

export interface ProjectDto {
  id: string;
  key: string;
  name: string;
  description: string;
  status: number;
  color: string;
  category: string;
  leadId: string | null;
  lead: Person | null;
  members: Person[];
  startDate: string | null;
  dueDate: string | null;
  budget: number;
  spent: number;
  progress: number;
  taskCounts: { total: number; done: number };
  milestones: Milestone[];
}

export interface ProjectInput {
  key: string;
  name: string;
  description?: string;
  status?: number;
  color?: string;
  category?: string;
  leadId?: string;
  startDate?: string;
  dueDate?: string;
  budget?: number;
  spent?: number;
  memberIds?: string[];
}

export const listProjectsApi = () => apiFetch<{ projects: ProjectDto[] }>("/work/projects").then((r) => r.projects);
export const getProjectApi = (id: string) => apiFetch<ProjectDto>(`/work/projects/${id}`);
export const createProjectApi = (input: ProjectInput) =>
  apiFetch<ProjectDto>("/work/projects", { method: "POST", body: JSON.stringify(input) });
export const updateProjectApi = (id: string, input: Partial<Omit<ProjectInput, "key">>) =>
  apiFetch<ProjectDto>(`/work/projects/${id}`, { method: "PATCH", body: JSON.stringify(input) });
export const deleteProjectApi = (id: string) => apiFetch<{ ok: true }>(`/work/projects/${id}`, { method: "DELETE" });

export const addMilestoneApi = (projectId: string, input: { title: string; date: string; done?: boolean }) =>
  apiFetch<Milestone>(`/work/projects/${projectId}/milestones`, { method: "POST", body: JSON.stringify(input) });
export const updateMilestoneApi = (id: string, input: { title?: string; date?: string; done?: boolean }) =>
  apiFetch<Milestone>(`/work/milestones/${id}`, { method: "PATCH", body: JSON.stringify(input) });
export const deleteMilestoneApi = (id: string) => apiFetch<{ ok: true }>(`/work/milestones/${id}`, { method: "DELETE" });

/* ───────── المهام ───────── */

export interface TaskDto {
  id: string;
  projectId: string;
  code: string;
  number: number;
  title: string;
  description: string;
  status: number;
  priority: number;
  assigneeId: string | null;
  assignee: Person | null;
  labels: string[];
  startDate: string | null;
  dueDate: string | null;
  points: number;
  position: number;
  comments: number;
  completedAt: string | null;
  createdAt: string;
  project: { key: string; name: string; color: string };
}

export interface TaskInput {
  projectId: string;
  title: string;
  description?: string;
  status?: number;
  priority?: number;
  assigneeId?: string;
  labels?: string[];
  startDate?: string;
  dueDate?: string;
  points?: number;
}

export interface TaskComment {
  id: string;
  body: string;
  createdAt: string;
  author: Person | null;
}

export function listTasksApi(f: { projectId?: string; assignee?: string; status?: number; q?: string } = {}) {
  const p = new URLSearchParams();
  if (f.projectId) p.set("projectId", f.projectId);
  if (f.assignee) p.set("assignee", f.assignee);
  if (f.status !== undefined) p.set("status", String(f.status));
  if (f.q) p.set("q", f.q);
  const qs = p.toString();
  return apiFetch<{ tasks: TaskDto[] }>(`/work/tasks${qs ? `?${qs}` : ""}`).then((r) => r.tasks);
}
export const createTaskApi = (input: TaskInput) =>
  apiFetch<TaskDto>("/work/tasks", { method: "POST", body: JSON.stringify(input) });
export const updateTaskApi = (
  id: string,
  input: Partial<Omit<TaskInput, "projectId" | "assigneeId">> & { assigneeId?: string | null; position?: number },
) => apiFetch<TaskDto>(`/work/tasks/${id}`, { method: "PATCH", body: JSON.stringify(input) });
export const deleteTaskApi = (id: string) => apiFetch<{ ok: true }>(`/work/tasks/${id}`, { method: "DELETE" });
export const listCommentsApi = (id: string) =>
  apiFetch<{ comments: TaskComment[] }>(`/work/tasks/${id}/comments`).then((r) => r.comments);
export const addCommentApi = (id: string, body: string) =>
  apiFetch<TaskComment>(`/work/tasks/${id}/comments`, { method: "POST", body: JSON.stringify({ body }) });

/* ───────── الإشعارات والنشاط ───────── */

export interface NotificationDto {
  id: string;
  kind: string;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
  actor: Person | null;
}

export const listNotificationsApi = (opts: { unread?: boolean; page?: number } = {}) => {
  const p = new URLSearchParams();
  if (opts.unread) p.set("unread", "1");
  if (opts.page) p.set("page", String(opts.page));
  const qs = p.toString();
  return apiFetch<{ notifications: NotificationDto[]; total: number; unread: number; pages: number }>(
    `/notifications${qs ? `?${qs}` : ""}`,
  );
};
export const notificationCountApi = () => apiFetch<{ unread: number }>("/notifications/count");
export const markNotificationReadApi = (id: string) =>
  apiFetch<{ ok: true }>(`/notifications/${id}/read`, { method: "PATCH" });
export const markAllNotificationsReadApi = () => apiFetch<{ updated: number }>("/notifications/read-all", { method: "POST" });
export const deleteNotificationApi = (id: string) => apiFetch<{ ok: true }>(`/notifications/${id}`, { method: "DELETE" });

export interface ActivityDto {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  description: string | null;
  createdAt: string;
  actor: Person | null;
}

export const listActivityApi = (opts: { page?: number; type?: string; projectId?: string } = {}) => {
  const p = new URLSearchParams();
  if (opts.projectId) p.set("projectId", opts.projectId);
  if (opts.page) p.set("page", String(opts.page));
  if (opts.type) p.set("type", opts.type);
  const qs = p.toString();
  return apiFetch<{ activity: ActivityDto[]; total: number; pages: number }>(`/activity${qs ? `?${qs}` : ""}`);
};

/* ───────── الاجتماعات (التقويم) ───────── */

export interface MeetingDto {
  id: string;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM */
  time: string;
  endTime: string | null;
  location: string | null;
  objective: string | null;
}

export const listMeetingsApi = () => apiFetch<MeetingDto[]>("/meetings");
export const createMeetingApi = (input: {
  title: string;
  date: string;
  time: string;
  endTime?: string;
  location?: string;
  objective?: string;
}) => apiFetch<MeetingDto>("/meetings", { method: "POST", body: JSON.stringify(input) });
export const deleteMeetingApi = (id: string) => apiFetch<unknown>(`/meetings/${id}`, { method: "DELETE" });
