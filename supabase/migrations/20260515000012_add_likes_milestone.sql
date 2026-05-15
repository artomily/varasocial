-- Migration: add likes milestone reward tracking
-- Tracks whether the 50k likes reward (0.1 0G) has been sent for a post.

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS likes_milestone_rewarded BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS likes_milestone_tx       TEXT;

-- Index to quickly find unrewarded posts that have crossed the threshold
CREATE INDEX IF NOT EXISTS posts_likes_milestone_idx
  ON public.posts (likes_count, likes_milestone_rewarded)
  WHERE likes_milestone_rewarded = FALSE;
