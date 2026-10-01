import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { routeUpsertSchema } from "@/lib/validation";

export async function GET() {
  const routes = await prisma.route.findMany({ orderBy: { destination: "asc" } });
  return NextResponse.json(routes);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = routeUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const route = await prisma.route.create({ data: parsed.data });
  return NextResponse.json(route, { status: 201 });
}
