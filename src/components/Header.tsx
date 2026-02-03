"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { Search, X, Play, Menu, Home, Compass, MonitorPlay, Zap, ArrowLeft } from "lucide-react";
import { AccountMenu } from "./AccountMenu";
import { useAuth } from "@/hooks/useAuth";
import { useSearchDramas } from "@/hooks/useDramas";
import { useReelShortSearch } from "@/hooks/useReelShort";
import { useNetShortSearch } from "@/hooks/useNetShort";
import { useMeloloSearch } from "@/hooks/useMelolo";
import { useFlickReelsSearch } from "@/hooks/useFlickReels";
import { useFreeReelsSearch } from "@/hooks/useFreeReels";
import { usePlatform } from "@/hooks/usePlatform";
import { useDebounce } from "@/hooks/useDebounce";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

import { useUIStore } from "@/hooks/useUIStore";

export function Header() {
  const pathname = usePathname();
  const { isSearchOpen, setSearchOpen } = useUIStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);
  const normalizedQuery = debouncedQuery.trim();
  const [scrolled, setScrolled] = useState(false);
  const { signInWithGoogle, user } = useAuth();

  // Scroll effect for glass header
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Platform context
  const { isDramaBox, isReelShort, isNetShort, isMelolo, isFlickReels, isFreeReels, platformInfo } = usePlatform();

  // Search logic remains same...
  const { data: dramaBoxResults, isLoading: isSearchingDramaBox } = useSearchDramas(isDramaBox ? normalizedQuery : "");
  const { data: reelShortResults, isLoading: isSearchingReelShort } = useReelShortSearch(isReelShort ? normalizedQuery : "");
  const { data: netShortResults, isLoading: isSearchingNetShort } = useNetShortSearch(isNetShort ? normalizedQuery : "");
  const { data: meloloResults, isLoading: isSearchingMelolo } = useMeloloSearch(isMelolo ? normalizedQuery : "");
  const { data: flickReelsResults, isLoading: isSearchingFlickReels } = useFlickReelsSearch(isFlickReels ? normalizedQuery : "");
  const { data: freeReelsResults, isLoading: isSearchingFreeReels } = useFreeReelsSearch(isFreeReels ? normalizedQuery : "");

  const isSearching = isDramaBox ? isSearchingDramaBox : isReelShort ? isSearchingReelShort : isNetShort ? isSearchingNetShort : isMelolo ? isSearchingMelolo : isFlickReels ? isSearchingFlickReels : isSearchingFreeReels;

  // Search results processing
  const searchResults = isDramaBox
    ? dramaBoxResults
    : isReelShort
      ? reelShortResults?.data
      : isNetShort
        ? netShortResults?.data
        : isMelolo
          ? meloloResults?.data?.search_data?.flatMap((item: any) => item.books || []).filter((book: any) => book.thumb_url && book.thumb_url !== "") || []
          : isFlickReels
            ? flickReelsResults?.data
            : freeReelsResults;

  const handleSearchClose = () => {
    setSearchOpen(false);
    setSearchQuery("");
  };

  // Hide header on watch pages if desired, or keep it for better nav
  if (pathname?.startsWith("/watch")) {
    return null;
  }

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled ? "glass-strong border-b border-white/5 h-16" : "bg-transparent h-20"
        )}
      >
        <div className="container mx-auto px-4 h-full">
          <div className="flex items-center justify-between h-full">

            <div className="flex items-center gap-4">
              {/* Hamburger Trigger */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors md:hidden"
              >
                <Menu className="w-6 h-6" />
              </button>

              {/* Logo */}
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-red-500 to-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-primary/25">
                  <Play className="w-5 h-5 text-white fill-white" />
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-bold text-xl leading-none bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
                    Dracinku
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">
                    Premium Drama
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8 bg-black/20 backdrop-blur-md px-6 py-2 rounded-full border border-white/5">
              <Link href="/" className="text-sm font-medium text-white/90 hover:text-white hover:scale-105 transition-all">Home</Link>
              <Link href="/latest" className="text-sm font-medium text-white/70 hover:text-white hover:scale-105 transition-all">Latest</Link>
              <Link href="/trending" className="text-sm font-medium text-white/70 hover:text-white hover:scale-105 transition-all">Trending</Link>
              <Link href="/genres" className="text-sm font-medium text-white/70 hover:text-white hover:scale-105 transition-all">Genres</Link>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2.5 rounded-full hover:bg-white/10 transition-all group border border-transparent hover:border-white/10"
                aria-label="Search"
              >
                <Search className="w-5 h-5 text-white/80 group-hover:text-white" />
              </button>

              <Link
                href="/app"
                className="hidden md:flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full font-bold text-sm hover:scale-105 transition-transform"
              >
                <Zap className="w-4 h-4 fill-black" />
                <span>Get App</span>
              </Link>

              <AccountMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Portal */}
      {sidebarOpen && createPortal(
        <>
          <div
            className="fixed inset-0 bg-black/80 z-[60] backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed top-0 left-0 bottom-0 w-72 bg-[#0a0a0a] border-r border-white/10 z-[70] p-6 animate-in slide-in-from-left duration-300 flex flex-col">
            <div className="flex items-center justify-between mb-10">
              <Link href="/" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">D</div>
                <span className="text-xl font-bold text-white">Dracinku</span>
              </Link>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-2">
              <Link
                href="/"
                className="flex items-center gap-4 text-gray-300 hover:text-white hover:bg-white/5 p-3 rounded-xl transition-all group"
                onClick={() => setSidebarOpen(false)}
              >
                <Home className="w-5 h-5 group-hover:text-primary transition-colors" />
                <span className="font-medium">Home</span>
              </Link>
              <Link
                href="/latest"
                className="flex items-center gap-4 text-gray-300 hover:text-white hover:bg-white/5 p-3 rounded-xl transition-all group"
                onClick={() => setSidebarOpen(false)}
              >
                <Compass className="w-5 h-5 group-hover:text-primary transition-colors" />
                <span className="font-medium">Latest Dramas</span>
              </Link>
              <Link
                href="/trending"
                className="flex items-center gap-4 text-gray-300 hover:text-white hover:bg-white/5 p-3 rounded-xl transition-all group"
                onClick={() => setSidebarOpen(false)}
              >
                <MonitorPlay className="w-5 h-5 group-hover:text-primary transition-colors" />
                <span className="font-medium">Trending Now</span>
              </Link>
            </div>

            <div className="mt-auto space-y-4">
              {/* Google Login Button */}
              {!user && (
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    signInWithGoogle();
                  }}
                  className="w-full flex items-center justify-center gap-3 bg-white text-black font-medium py-3 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.66-2.84z" fill="#FBBC05" />
                    <path d="M12 4.63c1.61 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span>Masuk dengan Google</span>
                </button>
              )}

              <div className="p-4 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl border border-white/5">
                <h4 className="font-bold text-white mb-1">Premium Access</h4>
                <p className="text-xs text-gray-400 mb-3">Unlock all episodes without limits.</p>
                <button className="w-full bg-white text-black font-bold py-2 rounded-lg text-sm hover:scale-[1.02] transition-transform">
                  Go Premium
                </button>
              </div>
            </div>
          </aside>
        </>,
        document.body
      )}

      {/* Search Overlay (Portal) */}
      {isSearchOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 bg-background/95 backdrop-blur-xl z-[9999] overflow-hidden animate-in fade-in duration-200">
            <div className="container mx-auto px-4 py-6 h-[100dvh] flex flex-col">
              <div className="flex items-center gap-3 mb-4 flex-shrink-0">
                <button
                  onClick={handleSearchClose}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors flex-shrink-0 text-gray-400 hover:text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1 relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${platformInfo.name} library...`}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-base focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all text-white placeholder:text-gray-600"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleSearchClose}
                  className="hidden md:flex p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors flex-shrink-0 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Platform indicator */}
              <div className="mb-4 flex items-center gap-3 px-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Platform:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20 text-[10px]">
                  {platformInfo.name}
                </span>
                {normalizedQuery === "" && (
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-[10px] text-muted-foreground">Trending:</span>
                    <span className="text-[10px] text-white/50 bg-white/5 px-2 py-0.5 rounded cursor-pointer hover:text-white" onClick={() => setSearchQuery("Jodoh")}>Jodoh</span>
                    <span className="text-[10px] text-white/50 bg-white/5 px-2 py-0.5 rounded cursor-pointer hover:text-white" onClick={() => setSearchQuery("Love")}>Love</span>
                  </div>
                )}
              </div>

              {/* Search Results */}
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-2">
                {isSearching && normalizedQuery && (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-gray-500 animate-pulse">Searching library...</span>
                  </div>
                )}

                {!isSearching && searchResults && searchResults.length > 0 ? (
                  <div className="grid gap-4">
                    {/* Render logic similar to before but with improved cards */}
                    {/* We will reuse the mapping logic, simplified for brevity in this replace but keeping core functionality */}
                    {searchResults.map((item: any, idx: number) => {
                      // Normalize item properties for unified rendering
                      // Note: Accessing properties dynamically based on platform types handled in original code
                      // Since we replaced the file, we need to ensure the map logic is robust.
                      // For safety, falling back to dynamic property checks or using the known structure
                      const id = item.bookId || item.book_id || item.shortPlayId || item.playlet_id || item.key;
                      const title = item.bookName || item.book_title || item.title || item.book_name;
                      const img = item.cover || item.book_pic || item.thumb_url;
                      const desc = item.introduction || item.special_desc || item.description || item.abstract || item.introduce || item.desc;

                      // Construct Href
                      let href = "#";
                      if (isDramaBox) href = `/detail/dramabox/${id}`;
                      else if (isReelShort) href = `/detail/reelshort/${id}`;
                      else if (isNetShort) href = `/detail/netshort/${id}`;
                      else if (isMelolo) href = `/detail/melolo/${id}`;
                      else if (isFlickReels) href = `/detail/flickreels/${id}`;
                      else if (isFreeReels) href = `/detail/freereels/${id}`;

                      return (
                        <Link
                          key={idx}
                          href={href}
                          onClick={handleSearchClose}
                          className="flex gap-5 p-4 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group"
                        >
                          <div className="w-20 h-28 rounded-2xl overflow-hidden flex-shrink-0 relative shadow-lg bg-white/5">
                            <img
                              src={img?.startsWith('http') ? img : `https:${img}`}
                              alt={title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://placehold.co/400x600/1a1a1a/ffffff?text=No+Poster";
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0 py-1">
                            <h3 className="font-bold text-lg text-white mb-1 group-hover:text-primary transition-colors line-clamp-1">{title}</h3>
                            <p className="text-sm text-gray-400 line-clamp-2 mb-3 leading-relaxed">{desc}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] bg-white/10 px-2 py-1 rounded-md text-gray-300">Drama</span>
                              <span className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded-md font-medium">Free</span>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                ) : (
                  !isSearching && normalizedQuery && (
                    <div className="text-center py-20">
                      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-gray-600" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">No results found</h3>
                      <p className="text-gray-500">We couldn't find anything for "{normalizedQuery}"</p>
                    </div>
                  )
                )}

                {!normalizedQuery && (
                  <div className="text-center py-32 opacity-50">
                    <p>Search for titles, actors, or genres...</p>
                  </div>
                )}

              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

