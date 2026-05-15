-- Migration: add AI truth score report column to posts
-- Stores the LLM reasoning string alongside the existing truth_score and truth_level columns.

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS ai_report TEXT;
