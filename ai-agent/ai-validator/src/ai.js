import "dotenv/config";
import { logger } from "./logger.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const SYSTEM_PROMPT =
  'Anda adalah moderator konten profesional. Tugas Anda mendeteksi SARA ' +
  '(Suku, Agama, Ras, Antar-golongan) dan ujaran kebencian. ' +
  'Balas HANYA dengan JSON: {"is_safe": boolean, "reason": "string"}. ' +
  'Jangan berikan opini, hanya hasil objektif.';

/**
 * Check content for SARA / hate-speech via OpenRouter.
 *
 * Returns a safe default of `{ is_safe: false }` when the LLM response
 * cannot be parsed — conservative, but prevents bad content slipping through.
 *
 * @param {string} text  Content to evaluate
 * @returns {Promise<{ is_safe: boolean, reason: string }>}
 */
export async function checkSARA(text) {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://varasocial.app",
      "X-Title": "VaraSocial AI Validator",
    },
    body: JSON.stringify({
      model: process.env.LLM_MODEL ?? "google/gemini-2.0-flash-exp",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenRouter ${response.status}: ${body}`);
  }

  const json = await response.json();
  const raw = json.choices?.[0]?.message?.content;

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.is_safe !== "boolean") {
      throw new Error('Missing or invalid "is_safe" field');
    }
    return {
      is_safe: parsed.is_safe,
      reason: typeof parsed.reason === "string" ? parsed.reason : "",
    };
  } catch (err) {
    logger.error("Failed to parse AI response — treating as unsafe", {
      raw,
      parseError: err.message,
    });
    return {
      is_safe: false,
      reason: "AI response parse error — treated as unsafe (conservative default)",
    };
  }
}
