import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { computeUrgency } from "@/lib/urgency";
import { Resend } from "resend";

// POST /api/items/[id]/followup - log a follow-up action and optionally send email
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
    const { channel = "email", draftedByAi = false, notes, recipientEmail, emailBody } = body;

    let emailSentResult = "";
    if (channel === "email" && recipientEmail && emailBody && process.env.RESEND_API_KEY) {
      try {
        const resendClient = new Resend(process.env.RESEND_API_KEY);
        await resendClient.emails.send({
          from: "QueueFlow <onboarding@resend.dev>",
          to: recipientEmail,
          subject: `Follow-up: ${existing.title}`,
          text: emailBody,
        });
        emailSentResult = ` [Sent to ${recipientEmail}]`;
      } catch (err: any) {
        console.error("Resend email dispatch error:", err);
        emailSentResult = ` [Email failed: ${err.message || "Unknown error"}]`;
      }
    }

    const finalNotes = `${notes || ""}${emailSentResult}`;

    // Create follow-up record
    const followUp = await prisma.followUp.create({
      data: {
        waitingItemId: id,
        channel,
        draftedByAi,
        notes: finalNotes || null,
      },
    });

    // Update lastContactAt and recalculate status/score on the parent item
    const parentItem = await prisma.waitingItem.findUnique({
      where: { id },
      include: { followUps: true },
    });

    let updatedParent = null;
    if (parentItem) {
      const newLastContact = new Date();
      const urgency = computeUrgency({
        ...parentItem,
        lastContactAt: newLastContact,
      });

      updatedParent = await prisma.waitingItem.update({
        where: { id },
        data: {
          lastContactAt: newLastContact,
          status: urgency.status,
          urgencyScore: urgency.urgencyScore,
        },
        include: { followUps: { orderBy: { date: "asc" } } },
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

// DELETE /api/items/[id]/followup - delete a logged follow-up action
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
    const body = await request.json();
    const { followUpId } = body;

    if (!followUpId) {
      return NextResponse.json({ error: "Missing followUpId" }, { status: 400 });
    }

    // Verify item ownership first
    const existingItem = await prisma.waitingItem.findFirst({
      where: { id, userId: user.userId },
    });
    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Verify follow-up belongs to this item
    const followUp = await prisma.followUp.findFirst({
      where: { id: followUpId, waitingItemId: id },
    });
    if (!followUp) {
      return NextResponse.json({ error: "Follow-up not found" }, { status: 404 });
    }

    // Delete the follow-up
    await prisma.followUp.delete({
      where: { id: followUpId },
    });

    // Fetch remaining follow-ups sorted descending by date
    const remainingFollowUps = await prisma.followUp.findMany({
      where: { waitingItemId: id },
      orderBy: { date: "desc" },
    });

    // Roll back lastContactAt to the latest remaining follow-up, or card's creation date
    const lastContactAt = remainingFollowUps.length > 0
      ? remainingFollowUps[0].date
      : existingItem.createdAt;

    // Recalculate status/score on parent item
    const parentItem = await prisma.waitingItem.findUnique({
      where: { id },
      include: { followUps: true },
    });

    let updatedParent = null;
    if (parentItem) {
      const urgency = computeUrgency({
        ...parentItem,
        lastContactAt,
      });

      updatedParent = await prisma.waitingItem.update({
        where: { id },
        data: {
          lastContactAt,
          status: urgency.status,
          urgencyScore: urgency.urgencyScore,
        },
        include: { followUps: { orderBy: { date: "asc" } } },
      });
    }

    return NextResponse.json({ success: true, parentItem: updatedParent });
  } catch (error) {
    console.error("DELETE /api/items/[id]/followup error:", error);
    return NextResponse.json(
      { error: "Failed to delete follow-up" },
      { status: 500 }
    );
  }
}
