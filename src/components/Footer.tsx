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
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center shadow-lg shadow-primary/25">
            <span className="text-white font-bold text-lg">D</span>
          </div>
          <span className="font-bold text-lg text-white">Dracinku</span>
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
