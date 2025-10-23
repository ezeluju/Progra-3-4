import { NextResponse } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToCoreMessages, streamText } from "ai";
import { z } from "zod";

const textPartSchema = z.object({
  type: z.literal("text"),
  text: z.string().max(2000),
});

const messageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(["system", "user", "assistant"]),
  parts: z
    .array(
      z
        .object({
          type: z.string(),
        })
        .passthrough()
        .refine(
          (part) =>
            typeof part === "object" &&
            part !== null &&
            "type" in part &&
            typeof part.type === "string",
        ),
    )
    .optional()
    .default([]),
});

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1),
});

const DEFAULT_MODEL = "anthropic/claude-3-haiku";
const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";

const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: process.env.OPENROUTER_BASE_URL ?? DEFAULT_BASE_URL,
  headers: {
    "HTTP-Referer": process.env.OPENROUTER_SITE_URL ?? "http://localhost",
    "X-Title": process.env.OPENROUTER_APP_NAME ?? "Ejercicio 13 Chatbot",
  },
});

const sanitize = (input: string) =>
  input
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export async function POST(request: Request) {
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: "Falta la configuración de la API de OpenRouter." },
      { status: 500 },
    );
  }

  let parsedBody;
  try {
    const json = await request.json();
    parsedBody = requestSchema.parse(json);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof z.ZodError
            ? "Entrada no válida."
            : "No fue posible leer la solicitud.",
      },
      { status: 400 },
    );
  }

  const textOnlyMessages = parsedBody.messages
    .map((message) => {
      const textParts = message.parts
        .map((part) => {
          if (part.type !== "text") return null;
          const value = sanitize(String(part.text ?? ""));
          if (!value) return null;
          return { type: "text" as const, text: value };
        })
        .filter((part): part is { type: "text"; text: string } => part !== null);
      return {
        role: message.role,
        parts: textParts,
      };
    })
    .filter((message) => message.parts.length > 0);

  if (textOnlyMessages.length === 0) {
    return NextResponse.json(
      { error: "El mensaje está vacío después de la sanitización." },
      { status: 400 },
    );
  }

  try {
    const modelId = process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL;

    const result = await streamText({
      model: openrouter.chat(modelId),
      messages: convertToCoreMessages(textOnlyMessages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("OpenRouter request failed:", error);
    return NextResponse.json(
      { error: "No fue posible obtener una respuesta del modelo." },
      { status: 502 },
    );
  }
}
