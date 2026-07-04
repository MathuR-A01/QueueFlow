import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeUrgency } from "@/lib/urgency";
import { DEFAULT_LATENCY } from "@/lib/constants";
import type { AskType } from "@/lib/constants";
import { getAuthUser } from "@/lib/auth";

type WaitingItemWithFollowUps = Awaited<
  ReturnType<typeof prisma.waitingItem.findMany<{ include: { followUps: true } }>>
>[number];

// GET /api/items - list all waiting items with computed urgency for current user
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const askType = searchParams.get("askType");
    const counterpartyType = searchParams.get("counterpartyType");

    const items = await prisma.waitingItem.findMany({
      where: {
        userId: user.userId,
        ...(status && status !== "ALL" ? { status } : {}),
        ...(askType && askType !== "ALL" ? { askType } : {}),
        ...(counterpartyType && counterpartyType !== "ALL"
          ? { counterpartyType }
          : {}),
      },
      include: {
        followUps: {
          orderBy: { date: "asc" },
        },
      },
      orderBy: { urgencyScore: "desc" },
    });

    // Recompute urgency on every load for non-resolved items
    const updatedItems = await Promise.all(
      items.map(async (item: WaitingItemWithFollowUps) => {
        if (item.status === "RESOLVED") return item;

        const urgency = computeUrgency(item);

        // Update in DB if status or score changed
        if (
          urgency.status !== item.status ||
          urgency.urgencyScore !== item.urgencyScore
        ) {
          return await prisma.waitingItem.update({
            where: { id: item.id },
            data: {
              status: urgency.status,
              urgencyScore: urgency.urgencyScore,
            },
            include: { followUps: { orderBy: { date: "asc" } } },
          });
        }

        return item;
      })
    );

    return NextResponse.json({ items: updatedItems });
  } catch (error) {
    console.error("GET /api/items error:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}

// POST /api/items - create a new waiting item for current user
export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      counterpartyName,
      counterpartyType,
      askType,
      expectedBy,
      notes,
    } = body;

    if (!title || !counterpartyName || !counterpartyType || !askType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const typicalLatencyDays =
      DEFAULT_LATENCY[askType as AskType] ?? 7;

    // Compute correct initial status and score before database insertion
    const tempItem = {
      createdAt: new Date(),
      lastContactAt: new Date(),
      expectedBy: expectedBy ? new Date(expectedBy) : null,
      typicalLatencyDays,
      askType,
      followUps: [],
    };
    const urgency = computeUrgency(tempItem);

    const item = await prisma.waitingItem.create({
      data: {
        title,
        counterpartyName,
        counterpartyType,
        askType,
        typicalLatencyDays,
        expectedBy: expectedBy ? new Date(expectedBy) : null,
        notes: notes || null,
        status: urgency.status,
        urgencyScore: urgency.urgencyScore,
        userId: user.userId,
      },
      include: { followUps: true },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("POST /api/items error:", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}
