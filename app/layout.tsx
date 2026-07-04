import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QueueFlow — Track What You're Blocked On",
  description:
    "A focused tool for tracking asymmetric commitments — things you've already acted on and are waiting for someone else to respond to. Contractor quotes, client payments, permit approvals, HR responses.",
  keywords: ["queueflow", "follow-up tracker", "productivity", "task management"],
  openGraph: {
    title: "QueueFlow",
    description: "Track what you're blocked on. Not a todo list — a commitment queue.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
