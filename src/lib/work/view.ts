import {
  PROJECT_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  type Person,
  type ProjectDto,
  type TaskDto,
  type ProjectStatusLabel,
  type TaskPriorityLabel,
  type TaskStatusLabel,
} from "@/lib/api/work";

/**
 * أنواع العرض لمساحة المشروع (لوحة/قائمة/جدول زمني…): تحويل بسيط من DTO
 * الباكند إلى شكل تستهلكه المكوّنات مباشرة (تسميات عربية للحالات، مسؤول
 * غير فارغ، تواريخ `YYYY-MM-DD`). المعرّف الحقيقي في `uid`، و`id` هو الرمز
 * الظاهر (APP-12).
 */
export type { ProjectStatusLabel, TaskPriorityLabel, TaskStatusLabel };

export interface WMember {
  id: string;
  name: string;
  avatar: string;
}

export interface WTask {
  uid: string;
  /** الرمز الظاهر: APP-12 */
  id: string;
  title: string;
  description: string;
  status: TaskStatusLabel;
  priority: TaskPriorityLabel;
  assignee: WMember | null;
  labels: string[];
  projectId: string;
  start: string;
  due: string;
  points: number;
  comments: number;
}

export interface WProject {
  id: string;
  key: string;
  name: string;
  description: string;
  status: ProjectStatusLabel;
  statusCode: number;
  progress: number;
  category: string;
  lead: WMember | null;
  members: WMember[];
  start: string;
  due: string;
  budget: number;
  spent: number;
  taskCounts: { total: number; done: number };
  milestones: { id: string; title: string; date: string; done: boolean }[];
}

const day = (v: string | null | undefined) => (v ? v.slice(0, 10) : "");

export function toMember(p: Person): WMember {
  return { id: p.id, name: p.name, avatar: p.avatar ?? "" };
}

export function toProjectView(d: ProjectDto): WProject {
  return {
    id: d.id,
    key: d.key,
    name: d.name,
    description: d.description,
    status: PROJECT_STATUS_LABELS[d.status] ?? PROJECT_STATUS_LABELS[0],
    statusCode: d.status,
    progress: d.progress,
    category: d.category,
    lead: d.lead ? toMember(d.lead) : null,
    members: d.members.map(toMember),
    start: day(d.startDate),
    due: day(d.dueDate),
    budget: d.budget,
    spent: d.spent,
    taskCounts: d.taskCounts,
    milestones: d.milestones.map((m) => ({ ...m, date: day(m.date) })),
  };
}

export function toTaskView(d: TaskDto): WTask {
  return {
    uid: d.id,
    id: d.code,
    title: d.title,
    description: d.description,
    status: TASK_STATUS_LABELS[d.status] ?? TASK_STATUS_LABELS[1],
    priority: TASK_PRIORITY_LABELS[d.priority] ?? TASK_PRIORITY_LABELS[1],
    assignee: d.assignee ? toMember(d.assignee) : null,
    labels: d.labels,
    projectId: d.projectId,
    start: day(d.startDate) || day(d.createdAt),
    due: day(d.dueDate),
    points: d.points,
    comments: d.comments,
  };
}

export const statusCode = (label: TaskStatusLabel) => TASK_STATUS_LABELS.indexOf(label);
export const priorityCode = (label: TaskPriorityLabel) => TASK_PRIORITY_LABELS.indexOf(label);

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);
}
