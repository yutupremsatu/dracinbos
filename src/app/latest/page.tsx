"use client";

import { useLatestDramas } from "@/hooks/useDramas";
import { UnifiedMediaCard } from "@/components/UnifiedMediaCard";
import { UnifiedMediaCardSkeleton } from "@/components/UnifiedMediaCardSkeleton";
import { UnifiedErrorDisplay } from "@/components/UnifiedErrorDisplay";

export default function LatestPage() {
    const { data, isLoading, error, refetch } = useLatestDramas();

    return (
        <main className="min-h-screen pt-24 pb-20 container mx-auto px-4">
            <h1 className="text-3xl font-display font-bold text-white mb-8">Latest Dramas</h1>

            {error ? (
                <UnifiedErrorDisplay
                    title="Failed to load latest dramas"
                    message="Please try again later."
                    onRetry={() => refetch()}
                />
            ) : isLoading ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
                    {Array.from({ length: 24 }).map((_, i) => (
                        <UnifiedMediaCardSkeleton key={i} />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
                    {data?.map((drama, index) => {
                        const isPopular = drama.corner?.name?.toLowerCase().includes("populer");
                        const badgeColor = isPopular ? "#E52E2E" : (drama.corner?.color || "#e5a00d");

                        return (
                            <UnifiedMediaCard
                                key={drama.bookId || index}
                                index={index}
                                title={drama.bookName}
                                cover={drama.coverWap || drama.cover || ""}
                                link={`/detail/dramabox/${drama.bookId}`}
                                episodes={drama.chapterCount}
                                topLeftBadge={drama.corner ? {
                                    text: drama.corner.name,
                                    color: badgeColor
                                } : null}
                                topRightBadge={drama.rankVo ? {
                                    text: drama.rankVo.hotCode,
                                    isTransparent: true
                                } : null}
                            />
                        );
                    })}
                </div>
            )}
        </main>
    );
}
