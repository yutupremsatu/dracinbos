"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();

  // Hide footer on watch pages for immersive video experience
  if (pathname?.startsWith("/watch")) {
    return null;
  }

  return (
    <footer className="border-t border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 bg-red-500/40 rounded-lg blur-md" />
            <img src="/logo.png" alt="Dracinku" className="relative w-8 h-8 rounded-lg" />
          </div>
          <span className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-500" style={{ textShadow: '0 0 15px rgba(239,68,68,0.4)' }}>Dracinku</span>
        </div>

        <p className="text-xs text-muted-foreground/60 text-center max-w-sm leading-relaxed">
          Nonton drama asia subtitle indonesia gratis tanpa ribet.
        </p>

        <p className="text-[10px] text-muted-foreground/40 text-center font-medium mt-4">
          © {new Date().getFullYear()} Dracinku. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
