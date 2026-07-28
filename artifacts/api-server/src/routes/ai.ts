import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

function authMiddleware(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    req.authUser = JSON.parse(Buffer.from(auth.slice(7), "base64").toString());
    next();
  } catch { res.status(401).json({ error: "Unauthorized" }); }
}

// We support two ways of reaching an OpenAI-compatible chat endpoint:
//  1. OPENAI_API_KEY — a normal OpenAI API key, talking straight to api.openai.com.
//     This is what's set in the Vercel project's env vars.
//  2. AI_INTEGRATIONS_OPENAI_API_KEY (+ AI_INTEGRATIONS_OPENAI_BASE_URL) — Replit's
//     AI Integrations proxy, used automatically when developing inside Replit.
// The 500 we were seeing was because the code only ever looked for the second
// pair of names, which are never set on Vercel, so `apiKey` came through as
// undefined and the OpenAI client rejected every request before it left the server.
const apiKey = process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
const baseURL = process.env.OPENAI_API_KEY ? undefined : process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;

// "gpt-5.4" (used in the Replit integration template this was based on) isn't a
// real OpenAI model name — it only resolves through Replit's proxy. Against the
// real OpenAI API it 404s, which is the other half of the 500. Default to a real,
// inexpensive model, but let it be overridden via env without a code change.
const CHAT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const openai = apiKey ? new OpenAI({ apiKey, baseURL }) : null;

const SYSTEM_PROMPT =
  "You are 2torAssist, a friendly, encouraging AI study partner inside the 2torConnect " +
  "tutoring platform. Help students with maths, essays, code, and study planning. Keep " +
  "answers clear and well-structured, using Markdown (headings, lists, code blocks) where " +
  "it helps readability.";

// POST /chat — streams a chat completion back to the client as Server-Sent Events.
// Body: { message: string, history?: { role: "user"|"assistant", content: string }[] }
router.post("/chat", authMiddleware, async (req: any, res) => {
  const { message, history } = req.body ?? {};

  if (typeof message !== "string" || !message.trim()) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  if (!openai) {
    req.log.error("AI chat request failed: no OPENAI_API_KEY / AI_INTEGRATIONS_OPENAI_API_KEY configured");
    res.status(500).json({ error: "AI assistant is not configured on the server" });
    return;
  }

  const priorMessages = Array.isArray(history)
    ? history
        .filter((m: any) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .map((m: any) => ({ role: m.role, content: m.content }))
    : [];

  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    ...priorMessages,
    { role: "user" as const, content: message },
  ];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  // Flush headers immediately so the client's reader starts consuming the stream.
  (res as any).flushHeaders?.();

  try {
    const stream = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content || "";
      if (delta) {
        res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    req.log.error({ err }, "AI chat error");
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: "Failed to get a response, please try again." })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ error: "Failed to reach the AI assistant" });
    }
  }
});

export default router;