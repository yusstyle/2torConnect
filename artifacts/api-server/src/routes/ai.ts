import { Router } from "express";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const SYSTEM_PROMPT = `You are 2torAssist — a smart, friendly AI study assistant built into 2torConnect, a tutoring marketplace for Nigerian university students.

Your capabilities:
- Explain difficult academic concepts clearly and simply
- Help with essay writing, proofreading, and structuring arguments
- Solve maths, physics, chemistry, biology, and other science problems step by step
- Translate and explain technical jargon in plain language
- Summarise textbooks, articles, or lecture notes
- Generate study plans and revision schedules
- Quiz students on topics to help them prepare for exams
- Give career advice related to Nigerian universities and professional fields
- Help with coding in Python, JavaScript, C++, Java, and other languages
- Provide motivation and study tips tailored to university life in Nigeria

Tone: Warm, encouraging, and clear. You can use Nigerian English naturally (e.g. "No wahala!", "You've got this!") but always remain professional and helpful.
Currency references should use Naira (₦) when relevant.
Keep responses concise but thorough — students are busy, so be efficient.`;

router.post("/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body as {
      message: string;
      history: { role: "user" | "assistant"; content: string }[];
    };

    if (!message?.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.slice(-20),
      { role: "user", content: message },
    ];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await openai.chat.completions.create({
      model: "gpt-5.4",
      messages,
      stream: true,
      max_completion_tokens: 2048,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    return res.end();
  } catch (err) {
    console.error("AI chat error:", err);
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: "AI error" })}\n\n`);
      return res.end();
    } else {
      return res.status(500).json({ error: "Failed to get AI response" });
    }
  }
});

export default router;
