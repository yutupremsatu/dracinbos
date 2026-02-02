"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play, Info } from "lucide-react";
import type { ReelShortBanner } from "@/types/reelshort";
import { cn } from "@/lib/utils";

interface BannerCarouselProps {
  banners: ReelShortBanner[];
  autoPlayInterval?: number;
}

export function BannerCarousel({
  banners,
  autoPlayInterval = 6000,
}: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [loading, setLoading] = useState(true);

  // Preload images
  useEffect(() => {
    if (banners.length > 0) setLoading(false);
  }, [banners]);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  // Auto-play
  useEffect(() => {
    if (isHovered || banners.length <= 1) return;

    const interval = setInterval(nextSlide, autoPlayInterval);
    return () => clearInterval(interval);
  }, [isHovered, nextSlide, autoPlayInterval, banners.length]);

  if (!banners || banners.length === 0) return null;

  return (
    <div
      className="relative w-full aspect-[3/4] sm:aspect-[2/1] md:aspect-[2.5/1] lg:aspect-[3.5/1] rounded-3xl overflow-hidden group shadow-2xl ring-1 ring-white/10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {banners.map((banner, index) => (
        <div
          key={banner.jump_param.book_id}
          className={cn(
            "absolute inset-0 transition-opacity duration-1000 ease-in-out",
            index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
          )}
        >
          <Link href={`/detail/reelshort/${banner.jump_param.book_id}`} className="block w-full h-full relative">
            <img
              src={banner.pic}
              alt={banner.jump_param.book_title}
              className={cn(
                "w-full h-full object-cover transition-transform duration-[10000ms] ease-linear",
                index === currentIndex ? "scale-105" : "scale-100"
              )}
            />

            {/* Cinematic Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/30 to-transparent" />

            {/* Content Container */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:p-12 flex flex-col items-start gap-4">
              {/* Badge */}
              {banner.book_mark?.text && (
                <div
                  className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/20 animate-fade-down"
                  style={{
                    backgroundColor: banner.book_mark.color ? `${banner.book_mark.color}CC` : "#E52E2ECC",
                    color: banner.book_mark.text_color || "#FFFFFF",
                  }}
                >
                  {banner.book_mark.text}
                </div>
              )}

              <div className="space-y-2 max-w-2xl animate-fade-up">
                {/* Artistic Title */}
                {banner.pic_artistic_word ? (
                  <img
                    src={banner.pic_artistic_word}
                    alt=""
                    className="h-16 md:h-24 object-contain origin-left"
                  />
                ) : (
                  <h3 className="text-3xl md:text-5xl font-black text-white leading-tight drop-shadow-2xl">
                    {banner.jump_param.book_title}
                  </h3>
                )}

                {/* Meta Info */}
                {banner.jump_param.book_theme && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {banner.jump_param.book_theme.slice(0, 3).map((theme) => (
                      <span
                        key={theme}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white backdrop-blur-md border border-white/10"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 mt-4 animate-fade-up" style={{ animationDelay: '100ms' }}>
                <button className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/25 group">
                  <Play className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
                  <span>Watch Now</span>
                </button>
                <button className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-medium backdrop-blur-md border border-white/10 transition-all hover:scale-105">
                  <Info className="w-5 h-5" />
                  <span>More Info</span>
                </button>
              </div>
            </div>
          </Link>
        </div>
      ))}

      {/* Navigation Arrows */}
      <div className="absolute right-6 bottom-6 flex gap-2 z-20">
        <button
          onClick={(e) => { e.preventDefault(); prevSlide(); }}
          className="p-3 rounded-full bg-black/50 hover:bg-primary text-white backdrop-blur-md border border-white/10 transition-all hover:scale-110 active:scale-90"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={(e) => { e.preventDefault(); nextSlide(); }}
          className="p-3 rounded-full bg-black/50 hover:bg-primary text-white backdrop-blur-md border border-white/10 transition-all hover:scale-110 active:scale-90"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Simple Indicators */}
      <div className="absolute bottom-0 left-0 right-0 h-1 flex">
        {banners.map((_, idx) => (
          <div
            key={idx}
            className={cn(
              "h-full flex-1 transition-colors duration-300",
              idx === currentIndex ? "bg-primary" : "bg-transparent"
            )}
          />
        ))}
      </div>
    </div>
  );
}

