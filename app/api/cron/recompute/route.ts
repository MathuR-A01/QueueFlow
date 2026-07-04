import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeUrgency } from "@/lib/urgency";

// POST /api/cron/recompute - daily urgency recompute job
// Protected by CRON_SECRET header
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all non-resolved items
    const items = await prisma.waitingItem.findMany({
      where: { status: { not: "RESOLVED" } },
      include: { followUps: { orderBy: { date: "asc" } } },
    });

    let updatedCount = 0;
    // Map of userId -> { name: string, email: string, newlyDueSoon: string[], newlyOverdue: string[] }
    const userNotifications: Record<string, { name: string; email: string; newlyDueSoon: string[]; newlyOverdue: string[] }> = {};

    for (const item of items) {
      const urgency = computeUrgency(item);

      const updateData: Record<string, unknown> = {
        urgencyScore: urgency.urgencyScore,
        status: urgency.status,
      };

      let changed = false;

      // Track notification flags for first-time threshold crossings
      if (urgency.status === "DUE_SOON" && !item.notifiedDueSoon) {
        updateData.notifiedDueSoon = true;
        changed = true;
      }
      if (urgency.status === "OVERDUE" && !item.notifiedOverdue) {
        updateData.notifiedOverdue = true;
        changed = true;
      }

      await prisma.waitingItem.update({
        where: { id: item.id },
        data: updateData,
      });
      updatedCount++;

      // If status changed to something important, queue notification
      if (changed) {
        if (!userNotifications[item.userId]) {
          const user = await prisma.user.findUnique({ where: { id: item.userId } });
          if (user) {
            userNotifications[item.userId] = {
              name: user.name,
              email: user.email,
              newlyDueSoon: [],
              newlyOverdue: [],
            };
          }
        }

        const notifyGroup = userNotifications[item.userId];
        if (notifyGroup) {
          if (urgency.status === "DUE_SOON") {
            notifyGroup.newlyDueSoon.push(item.title);
          } else if (urgency.status === "OVERDUE") {
            notifyGroup.newlyOverdue.push(item.title);
          }
        }
      }
    }

    // Email notifications (personalized per user)
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        for (const [userId, data] of Object.entries(userNotifications)) {
          if (data.newlyDueSoon.length === 0 && data.newlyOverdue.length === 0) continue;

          await resend.emails.send({
            from: "QueueFlow <notifications@queueflow.io>",
            to: data.email,
            subject: `QueueFlow Update: ${data.newlyOverdue.length} overdue, ${data.newlyDueSoon.length} due soon`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #f0f1f5; background: #05060b; padding: 24px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.06);">
                <h2 style="color: #818cf8; margin-bottom: 16px;">QueueFlow Status Update</h2>
                <p>Hello ${data.name},</p>
                <p>The following items in your QueueFlow queue have changed status:</p>
                
                ${data.newlyOverdue.length > 0 ? `
                  <div style="margin-bottom: 20px;">
                    <h3 style="color: #f43f5e; margin-bottom: 8px;">🔴 Overdue:</h3>
                    <ul style="padding-left: 20px;">
                      ${data.newlyOverdue.map(title => `<li style="margin-bottom: 4px;">${title}</li>`).join("")}
                    </ul>
                  </div>
                ` : ""}

                ${data.newlyDueSoon.length > 0 ? `
                  <div style="margin-bottom: 20px;">
                    <h3 style="color: #f59e0b; margin-bottom: 8px;">🟡 Due Soon:</h3>
                    <ul style="padding-left: 20px;">
                      ${data.newlyDueSoon.map(title => `<li style="margin-bottom: 4px;">${title}</li>`).join("")}
                    </ul>
                  </div>
                ` : ""}

                <p style="margin-top: 24px;"><a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">Open Dashboard</a></p>
              </div>
            `,
          });
        }
      } catch (emailError) {
        console.error("Email notification failed:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      notifiedUsers: Object.keys(userNotifications).length,
    });
  } catch (error) {
    console.error("POST /api/cron/recompute error:", error);
    return NextResponse.json(
      { error: "Cron job failed" },
      { status: 500 }
    );
  }
}

// Allow GET for easy manual testing in dev
export async function GET(request: NextRequest) {
  return POST(request);
}
