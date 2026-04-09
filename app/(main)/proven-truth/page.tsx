import { MOCK_POSTS } from "@/lib/mock-data";
import { TruthBadge } from "@/components/common/TruthBadge";

export default function ProvenTruthPage() {
  const sortedByTruth = [...MOCK_POSTS].sort(
    (a, b) => b.truthScore - a.truthScore
  );

  const validCount = MOCK_POSTS.filter((p) => p.truthLevel === "valid").length;
  const suspiciousCount = MOCK_POSTS.filter(
    (p) => p.truthLevel === "suspicious"
  ).length;
  const hoaxCount = MOCK_POSTS.filter((p) => p.truthLevel === "hoax").length;

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 px-4 py-4 backdrop-blur-md">
        <h1 className="text-xl font-bold">Proven Truth</h1>
        <p className="text-sm text-secondary">
          AI-powered fact checking & truth scores
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 p-4">
        <div className="rounded-xl bg-surface p-4 text-center">
          <p className="text-2xl font-bold text-truth-valid">{validCount}</p>
          <p className="text-xs text-secondary">Verified</p>
        </div>
        <div className="rounded-xl bg-surface p-4 text-center">
          <p className="text-2xl font-bold text-truth-suspicious">
            {suspiciousCount}
          </p>
          <p className="text-xs text-secondary">Suspicious</p>
        </div>
        <div className="rounded-xl bg-surface p-4 text-center">
          <p className="text-2xl font-bold text-truth-hoax">{hoaxCount}</p>
          <p className="text-xs text-secondary">Hoax</p>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="border-t border-border">
        <h2 className="px-4 pt-4 pb-2 font-bold">Truth Score Leaderboard</h2>
        {sortedByTruth.map((post, i) => (
          <div
            key={post.id}
            className="flex items-center gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-surface/50"
          >
            <span className="w-6 text-center text-sm font-bold text-secondary">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">
                <span className="font-bold">{post.author.displayName}</span>{" "}
                <span className="text-secondary">@{post.author.handle}</span>
              </p>
              <p className="truncate text-sm text-secondary">{post.content}</p>
            </div>
            <TruthBadge level={post.truthLevel} score={post.truthScore} />
          </div>
        ))}
      </div>
    </div>
  );
}
