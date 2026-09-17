import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import ManagementMember from "@/models/ManagementMember";
import { ensureManagementSeeded } from "@/lib/management";
import { getSignedFileUrl } from "@/lib/r2";

export const dynamic = "force-dynamic";

export async function GET() {
  await connectToDatabase();
  await ensureManagementSeeded();
  const members = await ManagementMember.find().sort({ order: 1, createdAt: 1 }).lean();

  const data = await Promise.all(
    members.map(async (member) => ({
      id: member._id.toString(),
      name: member.name,
      role: member.role,
      roleUr: member.roleUr || "",
      copy: member.copy,
      copyUr: member.copyUr || "",
      photo: await getSignedFileUrl(member.photo),
    }))
  );

  return NextResponse.json({ members: data }, { headers: { "Cache-Control": "no-store" } });
}
