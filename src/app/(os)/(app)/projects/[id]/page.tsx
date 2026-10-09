"use client";

import { useParams } from "next/navigation";

import { ProjectDetail } from "./project-detail";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <ProjectDetail key={id} projectId={id} />;
}
