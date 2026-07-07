import { redirect } from "next/navigation";

export default async function ClassroomIndexPage({
  params,
}: {
  params: Promise<{ classroomId: string }>;
}) {
  const { classroomId } = await params;
  redirect(`/classes/${classroomId}/stream`);
}
