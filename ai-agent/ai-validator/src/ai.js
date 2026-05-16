import "dotenv/config";
import { logger } from "./logger.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const FETCH_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;

function isRetryable(err) {
  return (
    err.code === "ECONNRESET" ||
    err.code === "ETIMEDOUT" ||
    err.code === "UND_ERR_SOCKET" ||
    err.name === "AbortError" ||
    (typeof err.message === "string" && err.message.includes("socket hang up"))
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * `fetch` wrapper with a hard timeout and exponential-backoff retry.
 * Retries on transient network errors (ECONNRESET, AbortError, etc.).
 */
async function fetchWithRetry(url, options) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      if (attempt === MAX_RETRIES - 1 || !isRetryable(err)) throw err;
      const delay = 1_000 * 2 ** attempt;
      logger.warn(`OpenRouter fetch failed (attempt ${attempt + 1}/${MAX_RETRIES}), retry in ${delay}ms`, {
        error: err.message,
      });
      await sleep(delay);
    }
  }
}

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
  let response;
  try {
    response = await fetchWithRetry(OPENROUTER_URL, {
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
  } catch (err) {
    logger.error("OpenRouter unreachable after retries — treating as unsafe (refund will be issued)", {
      error: err.message,
    });
    return {
      is_safe: false,
      reason: "AI service unreachable — treated as unsafe, fee refunded",
    };
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenRouter ${response.status}: ${body}`);
  }

  const json = await response.json();
  const raw = json.choices?.[0]?.message?.content;

  if (raw === undefined) {
    logger.warn("OpenRouter response missing choices content (checkSARA)", { responseBody: json });
  }

  try {
    const parsed = JSON.parse(raw);
    // Coerce string booleans that some models return instead of JSON booleans
    if (parsed.is_safe === "true") parsed.is_safe = true;
    else if (parsed.is_safe === "false") parsed.is_safe = false;
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

const TRUTH_SYSTEM_PROMPT =
  'Anda adalah sistem penilaian kebenaran konten media sosial. ' +
  'Tugas Anda menilai apakah sebuah postingan mengandung hoaks, disinformasi, atau konten SARA ' +
  '(Suku, Agama, Ras, Antar-golongan) yang merugikan orang lain. ' +
  'Balas HANYA dengan JSON valid: ' +
  '{"truth_score": number, "truth_level": "valid"|"suspicious"|"hoax", "reason": "string"}. ' +
  'truth_score adalah angka 0-100 (100 = sangat valid/faktual, 0 = hoaks/berbahaya). ' +
  'truth_level: "valid" jika skor >= 70, "suspicious" jika 40-69, "hoax" jika < 40. ' +
  'Jangan berikan opini, hanya hasil penilaian objektif.';

/**
 * Assess a post's truthfulness / SARA content via OpenRouter.
 *
 * Returns a conservative default (truth_score=50, truth_level="suspicious")
 * when the LLM response cannot be parsed, so unanalysed posts are never
 * silently marked as valid.
 *
 * @param {string} text  Post content to evaluate
 * @returns {Promise<{ truth_score: number, truth_level: "valid"|"suspicious"|"hoax", reason: string }>}
 */
export async function assessTruthScore(text) {
  let response;
  try {
    response = await fetchWithRetry(OPENROUTER_URL, {
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
          { role: "system", content: TRUTH_SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
        response_format: { type: "json_object" },
        temperature: 0,
      }),
    });
  } catch (err) {
    logger.error("OpenRouter unreachable (truth score) — returning suspicious default", {
      error: err.message,
    });
    return { truth_score: 50, truth_level: "suspicious", reason: "AI service unreachable" };
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenRouter ${response.status}: ${body}`);
  }

  const json = await response.json();
  const raw = json.choices?.[0]?.message?.content;

  if (raw === undefined) {
    logger.warn("OpenRouter response missing choices content (assessTruthScore)", { responseBody: json });
  }

  try {
    const parsed = JSON.parse(raw);
    const score = Number(parsed.truth_score);
    const level = parsed.truth_level;

    if (
      !Number.isFinite(score) ||
      score < 0 ||
      score > 100 ||
      !["valid", "suspicious", "hoax"].includes(level)
    ) {
      throw new Error("Invalid truth_score or truth_level in AI response");
    }

    return {
      truth_score: Math.round(score),
      truth_level: level,
      reason: typeof parsed.reason === "string" ? parsed.reason : "",
    };
  } catch (err) {
    logger.error("Failed to parse truth score AI response — returning suspicious default", {
      raw,
      parseError: err.message,
    });
    return {
      truth_score: 50,
      truth_level: "suspicious",
      reason: "AI response parse error — defaulted to suspicious",
    };
  }
}
