import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { computeUrgency } from "@/lib/urgency";

// POST /api/items/[id]/followup - log a follow-up action
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

    // Verify item ownership first
    const existing = await prisma.waitingItem.findFirst({
      where: { id, userId: user.userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const body = await request.json();
    const { channel = "email", draftedByAi = false, notes } = body;

    // Create follow-up record
    const followUp = await prisma.followUp.create({
      data: {
        waitingItemId: id,
        channel,
        draftedByAi,
        notes: notes || null,
      },
    });

    // Update lastContactAt and recalculate status/score on the parent item
    const parentItem = await prisma.waitingItem.findUnique({
      where: { id },
      include: { followUps: true },
    });

    let updatedParent = null;
    if (parentItem) {
      const urgency = computeUrgency(parentItem);

      updatedParent = await prisma.waitingItem.update({
        where: { id },
        data: {
          lastContactAt: new Date(),
          status: urgency.status,
          urgencyScore: urgency.urgencyScore,
        },
      });
    }

    return NextResponse.json({ followUp, parentItem: updatedParent }, { status: 201 });
  } catch (error) {
    console.error("POST /api/items/[id]/followup error:", error);
    return NextResponse.json(
      { error: "Failed to log follow-up" },
      { status: 500 }
    );
  }
}
