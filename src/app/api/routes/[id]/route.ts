import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { routeUpsertSchema } from "@/lib/validation";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = routeUpsertSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const route = await prisma.route.update({
    where: { id: Number(id) },
    data: parsed.data,
  });
  return NextResponse.json(route);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.route.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
