/**
 * config.js
 *
 * Global runtime config store for AI credentials and model selection.
 *
 * Values are initialised from environment variables on startup and can be
 * overridden at runtime via the POST /webhook/config endpoint — no process
 * restart required.
 *
 * Usage:
 *   import { getConfig, setConfig } from "./config.js";
 *
 *   const { apiKey, model } = getConfig();
 *   setConfig({ apiKey: "sk-new-key", model: "openai/gpt-4o" });
 */

import { logger } from "./logger.js";

const _cfg = {
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
  model: process.env.LLM_MODEL ?? "google/gemini-2.0-flash-exp",
};

/**
 * Return a snapshot of the current config.
 * @returns {{ apiKey: string, model: string }}
 */
export function getConfig() {
  return { ..._cfg };
}

/**
 * Override one or both config values at runtime.
 * Only non-empty string values are applied.
 *
 * @param {{ apiKey?: string, model?: string }} patch
 */
export function setConfig(patch) {
  let changed = false;

  if (patch.apiKey && typeof patch.apiKey === "string") {
    _cfg.apiKey = patch.apiKey;
    // Do NOT log the key value — security risk.
    logger.info("Config updated: apiKey changed");
    changed = true;
  }

  if (patch.model && typeof patch.model === "string") {
    _cfg.model = patch.model;
    logger.info("Config updated: model", { model: patch.model });
    changed = true;
  }

  if (!changed) {
    logger.warn("setConfig called with no valid fields");
  }
}
