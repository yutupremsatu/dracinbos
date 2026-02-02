"use client";

import Link from "next/link";
import { Home, Search, ChevronLeft, User, LayoutGrid } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    // Auto-hide on scroll logic for premium feel
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setIsVisible(false);
            } else {
                setIsVisible(true);
            }
            setLastScrollY(currentScrollY);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);

    const isActive = (path: string) => pathname === path;

    return (
        <div
            className={cn(
                "fixed bottom-6 left-4 right-4 h-16 md:hidden z-50 transition-all duration-300 ease-in-out",
                isVisible ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0"
            )}
        >
            <div className="h-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-around px-2 shadow-2xl ring-1 ring-white/5">
                <Link
                    href="/"
                    className={cn(
                        "flex flex-col items-center justify-center w-14 h-full relative group",
                        isActive("/") ? "text-primary" : "text-gray-400 hover:text-white"
                    )}
                >
                    <div className={cn(
                        "absolute -top-1 w-8 h-1 bg-primary rounded-b-full transition-all duration-300",
                        isActive("/") ? "opacity-100" : "opacity-0"
                    )} />
                    <Home className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-medium">Home</span>
                </Link>

                <Link
                    href="/search"
                    className={cn(
                        "flex flex-col items-center justify-center w-14 h-full relative group",
                        isActive("/search") ? "text-primary" : "text-gray-400 hover:text-white"
                    )}
                >
                    <div className={cn(
                        "absolute -top-1 w-8 h-1 bg-primary rounded-b-full transition-all duration-300",
                        isActive("/search") ? "opacity-100" : "opacity-0"
                    )} />
                    <Search className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-medium">Search</span>
                </Link>

                {/* Center Floating Action Button Style for Categories if needed, for now LayoutGrid */}
                <Link
                    href="/categories"
                    className={cn(
                        "flex flex-col items-center justify-center w-14 h-full relative group",
                        isActive("/categories") ? "text-primary" : "text-gray-400 hover:text-white"
                    )}
                >
                    <div className={cn(
                        "absolute -top-1 w-8 h-1 bg-primary rounded-b-full transition-all duration-300",
                        isActive("/categories") ? "opacity-100" : "opacity-0"
                    )} />
                    <LayoutGrid className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-medium">Genre</span>
                </Link>

                <button
                    onClick={() => router.back()}
                    className="flex flex-col items-center justify-center w-14 h-full text-gray-400 hover:text-white transition-colors active:scale-90"
                >
                    <ChevronLeft className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-medium">Back</span>
                </button>
            </div>
        </div>
    );
}
