import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { computeUrgency } from "@/lib/urgency";
import { verifyToken } from "@/lib/auth";
import KanbanBoard from "@/components/KanbanBoard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getDashboardData(userId: string) {
  const items = await prisma.waitingItem.findMany({
    where: { userId },
    include: {
      followUps: { orderBy: { date: "asc" } },
    },
    orderBy: { urgencyScore: "desc" },
  });

  // Recompute urgency on page load for non-resolved items
  const updatedItems = await Promise.all(
    items.map(async (item) => {
      if (item.status === "RESOLVED") return item;
      const urgency = computeUrgency(item);
      if (
        urgency.status !== item.status ||
        urgency.urgencyScore !== item.urgencyScore
      ) {
        return await prisma.waitingItem.update({
          where: { id: item.id },
          data: { status: urgency.status, urgencyScore: urgency.urgencyScore },
          include: { followUps: { orderBy: { date: "asc" } } },
        });
      }
      return item;
    })
  );

  return updatedItems;
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  
  if (!token) {
    redirect("/login");
  }

  const userSession = verifyToken(token);
  if (!userSession) {
    redirect("/login");
  }

  const items = await getDashboardData(userSession.userId);

  return (
    <KanbanBoard 
      initialItems={JSON.parse(JSON.stringify(items))} 
      currentUser={userSession}
    />
  );
}
