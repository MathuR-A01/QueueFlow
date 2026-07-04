import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { subDays, subHours } from "date-fns";
import { hashPassword } from "../lib/auth";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding Waiting Room database...");

  // Clear existing data
  await prisma.followUp.deleteMany();
  await prisma.waitingItem.deleteMany();
  await prisma.user.deleteMany();

  const now = new Date();

  // Create demo user
  const demoUser = await prisma.user.create({
    data: {
      email: "demo@waitingroom.app",
      passwordHash: hashPassword("password123"),
      name: "Demo User",
    },
  });

  const items = await Promise.all([
    // === OVERDUE items ===
    prisma.waitingItem.create({
      data: {
        userId: demoUser.id,
        title: "Kitchen renovation quote",
        counterpartyName: "Atlas Contractors LLC",
        counterpartyType: "COMPANY",
        askType: "PAYMENT",
        status: "OVERDUE",
        typicalLatencyDays: 10,
        createdAt: subDays(now, 18),
        lastContactAt: subDays(now, 18),
        urgencyScore: 100,
        notes: "Asked for itemized quote after the site visit on June 16",
        followUps: {
          create: [
            {
              date: subDays(now, 8),
              channel: "email",
              draftedByAi: true,
              notes: "Sent polite follow-up asking for ETA",
            },
          ],
        },
      },
    }),
    prisma.waitingItem.create({
      data: {
        userId: demoUser.id,
        title: "HR confirmation of new hire start date",
        counterpartyName: "Meridian HR Dept.",
        counterpartyType: "INSTITUTION",
        askType: "DOCUMENT",
        status: "OVERDUE",
        typicalLatencyDays: 7,
        createdAt: subDays(now, 14),
        lastContactAt: subDays(now, 14),
        urgencyScore: 100,
        notes: "Submitted onboarding paperwork on June 20. Start date TBD.",
        followUps: {
          create: [
            {
              date: subDays(now, 6),
              channel: "email",
              draftedByAi: false,
              notes: "Called the HR line, left voicemail",
            },
            {
              date: subDays(now, 2),
              channel: "email",
              draftedByAi: true,
              notes: "Second follow-up email, more direct in tone",
            },
          ],
        },
      },
    }),

    // === DUE SOON items ===
    prisma.waitingItem.create({
      data: {
        userId: demoUser.id,
        title: "Permit approval for deck extension",
        counterpartyName: "City Planning Office",
        counterpartyType: "INSTITUTION",
        askType: "DECISION",
        status: "DUE_SOON",
        typicalLatencyDays: 15,
        createdAt: subDays(now, 11),
        lastContactAt: subDays(now, 11),
        urgencyScore: 44,
        expectedBy: subDays(now, -4),
        notes: "Filed permit application on June 23. Estimated 2-week turnaround.",
      },
    }),
    prisma.waitingItem.create({
      data: {
        userId: demoUser.id,
        title: "Contract redline review",
        counterpartyName: "Jake Sorenson (Legal)",
        counterpartyType: "PERSON",
        askType: "DOCUMENT",
        status: "DUE_SOON",
        typicalLatencyDays: 7,
        createdAt: subDays(now, 5),
        lastContactAt: subDays(now, 5),
        urgencyScore: 43,
        notes: "Sent the vendor contract draft for review. Jake said 'end of the week'.",
      },
    }),

    // === WAITING items ===
    prisma.waitingItem.create({
      data: {
        userId: demoUser.id,
        title: "Investor intro call follow-through",
        counterpartyName: "Priya Mehta",
        counterpartyType: "PERSON",
        askType: "REPLY",
        status: "WAITING",
        typicalLatencyDays: 3,
        createdAt: subDays(now, 1),
        lastContactAt: subDays(now, 1),
        urgencyScore: 20,
        notes: "She said she'd send calendar link after our LinkedIn message exchange.",
      },
    }),
    prisma.waitingItem.create({
      data: {
        userId: demoUser.id,
        title: "Q3 payment from Vela Design Co.",
        counterpartyName: "Vela Design Co.",
        counterpartyType: "COMPANY",
        askType: "PAYMENT",
        status: "WAITING",
        typicalLatencyDays: 10,
        createdAt: subDays(now, 3),
        lastContactAt: subDays(now, 3),
        urgencyScore: 18,
        expectedBy: subDays(now, -7),
        notes: "Invoice #2024-047 sent June 28. Net-15 terms.",
      },
    }),
    prisma.waitingItem.create({
      data: {
        userId: demoUser.id,
        title: "Reference letter from Prof. Sharma",
        counterpartyName: "Prof. Ananya Sharma",
        counterpartyType: "PERSON",
        askType: "DOCUMENT",
        status: "WAITING",
        typicalLatencyDays: 7,
        createdAt: subDays(now, 2),
        lastContactAt: subDays(now, 2),
        urgencyScore: 17,
        notes: "Needed for grad school application. Deadline is July 31.",
      },
    }),
    prisma.waitingItem.create({
      data: {
        userId: demoUser.id,
        title: "Replacement parts delivery",
        counterpartyName: "TechParts Direct",
        counterpartyType: "COMPANY",
        askType: "DELIVERY",
        status: "WAITING",
        typicalLatencyDays: 5,
        createdAt: subDays(now, 1),
        lastContactAt: subDays(now, 1),
        urgencyScore: 12,
        expectedBy: subDays(now, -4),
        notes: "Order #TP-9821. Tracking not yet showing movement.",
      },
    }),

    // === RESOLVED items ===
    prisma.waitingItem.create({
      data: {
        userId: demoUser.id,
        title: "Bank account opening confirmation",
        counterpartyName: "First National Bank",
        counterpartyType: "INSTITUTION",
        askType: "DOCUMENT",
        status: "RESOLVED",
        typicalLatencyDays: 7,
        createdAt: subDays(now, 20),
        lastContactAt: subDays(now, 10),
        urgencyScore: 0,
        resolutionNote: "Received welcome kit and account credentials by mail.",
        actualLatencyDays: 10,
      },
    }),
    prisma.waitingItem.create({
      data: {
        userId: demoUser.id,
        title: "Design proposal approval",
        counterpartyName: "Novus Media Group",
        counterpartyType: "COMPANY",
        askType: "DECISION",
        status: "RESOLVED",
        typicalLatencyDays: 15,
        createdAt: subDays(now, 25),
        lastContactAt: subDays(now, 15),
        urgencyScore: 0,
        resolutionNote: "Client approved v3 with minor color adjustments. Contract signed.",
        actualLatencyDays: 10,
        followUps: {
          create: [
            {
              date: subDays(now, 18),
              channel: "email",
              draftedByAi: true,
              notes: "Gentle nudge after initial silence",
            },
          ],
        },
      },
    }),
  ]);

  console.log(`✅ Seeded ${items.length} waiting items`);
  console.log("📋 Items by status:");
  const statusCounts = items.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`   ${status}: ${count}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
