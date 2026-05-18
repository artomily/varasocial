import "dotenv/config";
import { logger } from "./logger.js";
import { getConfig } from "./config.js";

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
      logger.warn(`OpenRouter (clone) fetch failed (attempt ${attempt + 1}/${MAX_RETRIES}), retry in ${delay}ms`, {
        error: err.message,
      });
      await sleep(delay);
    }
  }
}

/**
 * Build the full prompt following the master brief format:
 *   SYSTEM: persona description
 *   USER:   post context + thread context (last 5 comments) + new comment
 *
 * @param {object} user   - { display_name, handle, persona }
 * @param {string} postContent
 * @param {{ author_handle: string, content: string }[]} threadComments  - up to 5
 * @param {string} newComment
 */
function buildPrompt(user, postContent, threadComments, newComment) {
  const personaDesc =
    user.persona ??
    `Pengguna media sosial dengan nama ${user.display_name} (@${user.handle}).`;

  const system =
    `Anda adalah ${personaDesc}\n` +
    `Anda sedang istirahat (Mode Turu). ` +
    `Tugas: Balas komentar di bawah ini seolah-olah Anda yang mengetiknya sendiri.`;

  const threadBlock =
    threadComments.length > 0
      ? threadComments
          .map((c, i) => `${i + 1}. @${c.author_handle}: ${c.content}`)
          .join("\n")
      : "(belum ada komentar sebelumnya)";

  const userMsg =
    `### CONTEXT ###\n` +
    `Postingan Anda: "${postContent}"\n\n` +
    `Thread Terakhir (${threadComments.length} Komen):\n${threadBlock}\n\n` +
    `### TARGET ###\n` +
    `Komentar Baru: "${newComment}"\n\n` +
    `### ATURAN ###\n` +
    `- Balas maksimal 1 kalimat.\n` +
    `- Harus nyambung dengan sejarah thread dan postingan asli.\n` +
    `- Gunakan dialek/slang sesuai persona.\n` +
    `- Jika komentar hanya emoji atau tidak penting, balas singkat atau gaya malas.\n` +
    `- Jangan sebutkan bahwa Anda AI.\n` +
    `- Balas HANYA teks balasan saja, tanpa format tambahan.`;

  return { system, userMsg };
}

/**
 * Generate an AI reply to a comment in the post author's persona.
 *
 * @param {{ display_name: string, handle: string, persona: string|null }} user
 * @param {string} postContent
 * @param {{ author_handle: string, content: string }[]} threadComments  Last 5 comments
 * @param {string} newComment
 * @returns {Promise<string>}
 */
export async function generateCloneReply(user, postContent, threadComments, newComment) {
  const { system, userMsg } = buildPrompt(user, postContent, threadComments, newComment);

  const response = await fetchWithRetry(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getConfig().apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://varasocial.app",
      "X-Title": "VaraSocial AI Clone",
    },
    body: JSON.stringify({
      model: getConfig().model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMsg },
      ],
      temperature: 0.85,
      max_tokens: 1024,
      // max_tokens: 256,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenRouter ${response.status}: ${body}`);
  }

  const json = await response.json();
  logger.debug("Raw OpenRouter response", { json: JSON.stringify(json) });

  const finishReason = json.choices?.[0]?.finish_reason;
  if (finishReason === "content_filter") {
    logger.warn("Clone AI: content filtered by model, skipping reply", {
      user: user.handle,
      finishReason,
    });
    return null;
  }

  const reply = json.choices?.[0]?.message?.content?.trim();

  if (!reply && finishReason === "length") {
    logger.warn("Clone AI: model hit token limit with no output, increase max_tokens or shorten prompt", {
      user: user.handle,
    });
    return null;
  }

  if (!reply) throw new Error(`Empty reply from AI model (finish_reason: ${finishReason ?? "unknown"})`);

  logger.debug("Clone AI reply generated", {
    user: user.handle,
    newCommentPreview: newComment.slice(0, 50),
    replyPreview: reply.slice(0, 80),
  });

  return reply;
}

