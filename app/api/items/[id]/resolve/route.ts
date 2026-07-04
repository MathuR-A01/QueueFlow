import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { differenceInCalendarDays } from "date-fns";
import { getAuthUser } from "@/lib/auth";

// POST /api/items/[id]/resolve - mark as resolved with a resolution note
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { resolutionNote } = body;

    const existing = await prisma.waitingItem.findFirst({
      where: { id, userId: user.userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const actualLatencyDays = differenceInCalendarDays(
      new Date(),
      existing.createdAt
    );

    const item = await prisma.waitingItem.update({
      where: { id },
      data: {
        status: "RESOLVED",
        urgencyScore: 0,
        resolutionNote: resolutionNote || null,
        actualLatencyDays,
      },
      include: { followUps: { orderBy: { date: "asc" } } },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("POST /api/items/[id]/resolve error:", error);
    return NextResponse.json(
      { error: "Failed to resolve item" },
      { status: 500 }
    );
  }
}
