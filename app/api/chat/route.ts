import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

function loadEnv() {
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const [key, ...rest] = line.split("=");
      if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
    }
  } catch {}
}
loadEnv();

const SYSTEM_PROMPT = `You are a smart and friendly stock market assistant integrated into Stockly — a personal investment app.

You help the user understand stocks, markets, financial concepts, and investment strategies.

Key guidelines:
- Answer questions about stocks, ETFs, indices, sectors, earnings, macroeconomics, and investing
- Explain financial concepts clearly (P/E ratio, EPS, VIX, market cap, etc.)
- Give balanced, educational answers — you are not a licensed financial advisor
- Keep answers concise but complete. Use bullet points when helpful
- The user may write in Hebrew or English — always reply in the same language as their question
- When the user asks about specific stocks (QQQ, VOO, SOFI, TA-125), you can provide general educational info about them
- Never give specific buy/sell advice — instead explain pros/cons, risks, and relevant data points`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing API key" }), { status: 500 });
  }
  const client = new Anthropic({ apiKey });
  const { messages } = await req.json();

  const stream = await client.messages.stream({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(event.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
