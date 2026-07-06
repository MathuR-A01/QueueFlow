import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// POST /api/nudge - generate 3 tone variants for a follow-up message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      counterpartyName,
      counterpartyType,
      askType,
      title,
      daysWaited,
      followUpCount,
      notes,
    } = body;

    // Graceful fallback if no API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        variants: [
          {
            tone: "Warm",
            message: `Hi ${counterpartyName}, just checking in on the ${title.toLowerCase()}. Happy to answer any questions if that would help move things along. Thanks!`,
          },
          {
            tone: "Neutral",
            message: `Hi ${counterpartyName}, following up on the ${title.toLowerCase()} from ${daysWaited} days ago. Could you share an update on the timeline? Thanks.`,
          },
          {
            tone: "Firm",
            message: `Hi ${counterpartyName}, I need an update on the ${title.toLowerCase()}. This has been pending for ${daysWaited} days. Please confirm a timeline by end of week.`,
          },
        ],
        fallback: true,
      });
    }

    const toneGuidance =
      followUpCount === 0
        ? "This is the first follow-up, so keep the tone warm, polite, and understanding."
        : followUpCount === 1
          ? "This is the second follow-up. Keep neutral, professional, and gently indicate the importance."
          : "This is the third or later follow-up. Be direct and firm, but still professional. Make it clear you need a response.";

    const prompt = `You are helping draft a follow-up message for someone who is waiting on another party.

Context:
- What they're waiting for: "${title}"
- Counterparty: ${counterpartyName} (${counterpartyType.toLowerCase()})
- Type of ask: ${askType.toLowerCase()} (e.g., a ${askType.toLowerCase()} is expected)
- Days waited: ${daysWaited} days
- Previous follow-up count: ${followUpCount}
- Additional context: ${notes || "None provided"}

Tone guidance: ${toneGuidance}

Write exactly 3 short follow-up messages (2-4 sentences each), one for each tone:
1. WARM: friendly, empathetic, assumes good faith
2. NEUTRAL: professional, matter-of-fact, clear
3. FIRM: direct, implies urgency, sets expectations

Format your response as valid JSON exactly like this:
{
  "variants": [
    {"tone": "Warm", "message": "..."},
    {"tone": "Neutral", "message": "..."},
    {"tone": "Firm", "message": "..."}
  ]
}

Keep messages concise, channel-appropriate for email, and don't include a subject line.`;

    const response = await client.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    // Parse JSON from Claude response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from Claude response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("POST /api/nudge error:", error);
    // Return fallback on any error
    const body = await request
      .json()
      .catch(() => ({ counterpartyName: "them", title: "this request", daysWaited: 0 }));
    return NextResponse.json({
      variants: [
        {
          tone: "Warm",
          message: `Hi, just checking in on "${body.title}". Please let me know if there's anything I can do to help move things along!`,
        },
        {
          tone: "Neutral",
          message: `Hi, following up on "${body.title}" from ${body.daysWaited} days ago. Could you provide an update? Thank you.`,
        },
        {
          tone: "Firm",
          message: `Hi, I'm following up on "${body.title}" which has been pending for ${body.daysWaited} days. Please respond with a timeline at your earliest convenience.`,
        },
      ],
      fallback: true,
    });
  }
}
