import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { computeUrgency } from "@/lib/urgency";

// PATCH /api/items/[id] - update status, notes, expected_by, title, counterparty, ask type
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    // First, verify the item belongs to the user
    const existing = await prisma.waitingItem.findFirst({
      where: { id, userId: user.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      status,
      notes,
      expectedBy,
      lastContactAt,
      title,
      counterpartyName,
      counterpartyType,
      askType,
    } = body;

    const updatedData: any = {
      ...(status !== undefined ? { status } : {}),
      ...(notes !== undefined ? { notes } : {}),
      ...(expectedBy !== undefined
        ? { expectedBy: expectedBy ? new Date(expectedBy) : null }
        : {}),
      ...(lastContactAt !== undefined
        ? { lastContactAt: new Date(lastContactAt) }
        : {}),
      ...(title !== undefined ? { title } : {}),
      ...(counterpartyName !== undefined ? { counterpartyName } : {}),
      ...(counterpartyType !== undefined ? { counterpartyType } : {}),
      ...(askType !== undefined ? { askType } : {}),
    };

    // Merge to recompute urgency correctly
    const mergedItem = {
      ...existing,
      ...updatedData,
    };

    // Recompute urgency if not RESOLVED
    if (mergedItem.status !== "RESOLVED") {
      const urgency = computeUrgency(mergedItem);
      updatedData.status = urgency.status;
      updatedData.urgencyScore = urgency.urgencyScore;
    }

    const item = await prisma.waitingItem.update({
      where: { id },
      data: updatedData,
      include: { followUps: { orderBy: { date: "asc" } } },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("PATCH /api/items/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}

// DELETE /api/items/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership before deleting
    const existing = await prisma.waitingItem.findFirst({
      where: { id, userId: user.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    await prisma.waitingItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/items/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}
