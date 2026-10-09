import { apiFetch } from "./client";

export interface CmsCategory {
  id: string;
  name: string;
  nameEn: string;
  slug: string;
  createdAt: string;
}

export interface CreateCategoryInput {
  name: string;
  nameEn: string;
  slug: string;
}

export function listCategories(): Promise<CmsCategory[]> {
  return apiFetch<CmsCategory[]>("/cms/categories");
}

export function createCategory(input: CreateCategoryInput): Promise<CmsCategory> {
  return apiFetch<CmsCategory>("/cms/categories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export const POST_STATUS = { DRAFT: 0, PUBLISHED: 1 } as const;
export type PostStatus = (typeof POST_STATUS)[keyof typeof POST_STATUS];
export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  [POST_STATUS.DRAFT]: "مسودة",
  [POST_STATUS.PUBLISHED]: "منشورة",
};

export interface CmsPost {
  id: string;
  title: string;
  titleEn: string | null;
  slug: string;
  description: string;
  content: string;
  metaDescription: string;
  keywords: string[];
  tags: string[];
  heroImageUrl: string | null;
  heroImageAlt: string | null;
  readingTime: number;
  status: PostStatus;
  featured: boolean;
  views: number;
  categoryId: string;
  category: CmsCategory;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface PostInput {
  title: string;
  titleEn?: string;
  slug: string;
  description: string;
  content: string;
  metaDescription: string;
  keywords?: string[];
  tags?: string[];
  heroImageUrl?: string;
  heroImageAlt?: string;
  status?: PostStatus;
  featured?: boolean;
  categoryId: string;
}

export function listPosts(status?: PostStatus): Promise<CmsPost[]> {
  const query = status !== undefined ? `?status=${status}` : "";
  return apiFetch<CmsPost[]>(`/cms/posts${query}`);
}

export function getPost(id: string): Promise<CmsPost> {
  return apiFetch<CmsPost>(`/cms/posts/${id}`);
}

export function createPost(input: PostInput): Promise<CmsPost> {
  return apiFetch<CmsPost>("/cms/posts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updatePost(id: string, input: Partial<PostInput>): Promise<CmsPost> {
  return apiFetch<CmsPost>(`/cms/posts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deletePost(id: string): Promise<void> {
  return apiFetch<void>(`/cms/posts/${id}`, { method: "DELETE" });
}

// ── الخدمات ─────────────────────────────────────────────────────

export const SERVICE_STATUS = { ACTIVE: 0, INACTIVE: 1 } as const;
export type ServiceStatus = (typeof SERVICE_STATUS)[keyof typeof SERVICE_STATUS];
export const SERVICE_STATUS_LABELS: Record<ServiceStatus, string> = {
  [SERVICE_STATUS.ACTIVE]: "نشطة",
  [SERVICE_STATUS.INACTIVE]: "غير نشطة",
};

export interface CmsService {
  id: string;
  title: string;
  titleEn: string;
  slug: string;
  description: string;
  descriptionEn: string;
  icon: string | null;
  features: string[];
  order: number;
  status: ServiceStatus;
  version: number;
}

export interface ServiceInput {
  title: string;
  titleEn: string;
  slug: string;
  description: string;
  descriptionEn: string;
  icon?: string;
  features?: string[];
  order?: number;
  status?: ServiceStatus;
}

export function listServices(): Promise<CmsService[]> {
  return apiFetch<CmsService[]>("/cms/services");
}

export function createService(input: ServiceInput): Promise<CmsService> {
  return apiFetch<CmsService>("/cms/services", { method: "POST", body: JSON.stringify(input) });
}

export function updateService(id: string, input: Partial<ServiceInput>): Promise<CmsService> {
  return apiFetch<CmsService>(`/cms/services/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function deleteService(id: string): Promise<void> {
  return apiFetch<void>(`/cms/services/${id}`, { method: "DELETE" });
}

// ── تصنيفات المشاريع ─────────────────────────────────────────────

export interface CmsProjectCategory {
  id: string;
  name: string;
  nameEn: string;
  slug: string;
  order: number;
}

export interface ProjectCategoryInput {
  name: string;
  nameEn: string;
  slug: string;
  order?: number;
}

export function listProjectCategories(): Promise<CmsProjectCategory[]> {
  return apiFetch<CmsProjectCategory[]>("/cms/project-categories");
}

export function createProjectCategory(input: ProjectCategoryInput): Promise<CmsProjectCategory> {
  return apiFetch<CmsProjectCategory>("/cms/project-categories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// ── المشاريع (معرض الأعمال) ──────────────────────────────────────

export const PROJECT_STATUS = { DRAFT: 0, PUBLISHED: 1, ARCHIVED: 2 } as const;
export type ProjectStatus = (typeof PROJECT_STATUS)[keyof typeof PROJECT_STATUS];
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  [PROJECT_STATUS.DRAFT]: "مسودة",
  [PROJECT_STATUS.PUBLISHED]: "منشور",
  [PROJECT_STATUS.ARCHIVED]: "مؤرشف",
};

export interface ProjectImage {
  id?: string;
  url: string;
  alt?: string | null;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
  blurHash?: string | null;
  order: number;
}

export const METRIC_DIRECTION = { UP: 0, DOWN: 1, NEUTRAL: 2 } as const;
export type MetricDirection = (typeof METRIC_DIRECTION)[keyof typeof METRIC_DIRECTION];

export interface ProjectMetric {
  id?: string;
  label: string;
  value: string;
  unit?: string | null;
  direction: MetricDirection;
  order: number;
}

export interface CmsProject {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  summary: string;
  description: string;
  challenge: string | null;
  solution: string | null;
  outcome: string | null;
  client: string | null;
  industry: string | null;
  year: number | null;
  categoryId: string | null;
  category: CmsProjectCategory | null;
  services: { serviceId: string; service: CmsService }[];
  coverImageUrl: string | null;
  gallery: ProjectImage[];
  metrics: ProjectMetric[];
  liveUrl: string | null;
  repoUrl: string | null;
  featured: boolean;
  order: number;
  status: ProjectStatus;
  publishedAt: string | null;
  views: number;
  createdAt: string;
  version: number;
}

export interface ProjectInput {
  slug: string;
  title: string;
  titleEn?: string;
  summary: string;
  description: string;
  challenge?: string;
  solution?: string;
  outcome?: string;
  client?: string;
  industry?: string;
  year?: number;
  categoryId?: string;
  serviceIds?: string[];
  coverImageUrl?: string;
  gallery?: Omit<ProjectImage, "id">[];
  metrics?: Omit<ProjectMetric, "id">[];
  liveUrl?: string;
  repoUrl?: string;
  featured?: boolean;
  order?: number;
  status?: ProjectStatus;
}

export function listProjects(): Promise<CmsProject[]> {
  return apiFetch<CmsProject[]>("/cms/projects");
}

export function getProject(id: string): Promise<CmsProject> {
  return apiFetch<CmsProject>(`/cms/projects/${id}`);
}

export function createProject(input: ProjectInput): Promise<CmsProject> {
  return apiFetch<CmsProject>("/cms/projects", { method: "POST", body: JSON.stringify(input) });
}

export function updateProject(id: string, input: Partial<ProjectInput>): Promise<CmsProject> {
  return apiFetch<CmsProject>(`/cms/projects/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function deleteProject(id: string): Promise<void> {
  return apiFetch<void>(`/cms/projects/${id}`, { method: "DELETE" });
}

// ── الوسائط ──────────────────────────────────────────────────────

export const MEDIA_TYPE = { IMAGE: 0, VIDEO: 1, DOCUMENT: 2 } as const;
export type MediaType = (typeof MEDIA_TYPE)[keyof typeof MEDIA_TYPE];
export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  [MEDIA_TYPE.IMAGE]: "صورة",
  [MEDIA_TYPE.VIDEO]: "فيديو",
  [MEDIA_TYPE.DOCUMENT]: "مستند",
};

export interface CmsMedia {
  id: string;
  url: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  type: MediaType;
  createdAt: string;
}

export interface MediaInput {
  url: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  type?: MediaType;
}

export function listMedia(): Promise<CmsMedia[]> {
  return apiFetch<CmsMedia[]>("/cms/media");
}

export function createMedia(input: MediaInput): Promise<CmsMedia> {
  return apiFetch<CmsMedia>("/cms/media", { method: "POST", body: JSON.stringify(input) });
}

export function deleteMedia(id: string): Promise<void> {
  return apiFetch<void>(`/cms/media/${id}`, { method: "DELETE" });
}

// ── رسائل التواصل ────────────────────────────────────────────────

export const CONTACT_STATUS = { UNREAD: 0, READ: 1, REPLIED: 2 } as const;
export type ContactStatus = (typeof CONTACT_STATUS)[keyof typeof CONTACT_STATUS];
export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  [CONTACT_STATUS.UNREAD]: "غير مقروءة",
  [CONTACT_STATUS.READ]: "مقروءة",
  [CONTACT_STATUS.REPLIED]: "تم الرد",
};

export interface CmsContact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  service: string | null;
  message: string;
  status: ContactStatus;
  createdAt: string;
}

export function listContacts(status?: ContactStatus): Promise<CmsContact[]> {
  const query = status !== undefined ? `?status=${status}` : "";
  return apiFetch<CmsContact[]>(`/cms/contacts${query}`);
}

export function updateContactStatus(id: string, status: ContactStatus): Promise<CmsContact> {
  return apiFetch<CmsContact>(`/cms/contacts/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// ── إعدادات الموقع ───────────────────────────────────────────────

export const SETTING_TYPE = { STRING: 0, JSON: 1, BOOLEAN: 2, NUMBER: 3 } as const;
export type SettingType = (typeof SETTING_TYPE)[keyof typeof SETTING_TYPE];
export const SETTING_TYPE_LABELS: Record<SettingType, string> = {
  [SETTING_TYPE.STRING]: "نص",
  [SETTING_TYPE.JSON]: "JSON",
  [SETTING_TYPE.BOOLEAN]: "منطقي",
  [SETTING_TYPE.NUMBER]: "رقم",
};

export interface CmsSetting {
  id: string;
  key: string;
  value: string;
  type: SettingType;
  label: string | null;
}

export function listSettings(): Promise<CmsSetting[]> {
  return apiFetch<CmsSetting[]>("/cms/settings");
}

export function upsertSetting(input: {
  key: string;
  value: string;
  type?: SettingType;
  label?: string;
}): Promise<CmsSetting> {
  return apiFetch<CmsSetting>("/cms/settings", { method: "POST", body: JSON.stringify(input) });
}
