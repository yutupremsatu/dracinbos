// Server component with generateStaticParams for Next.js static export
import { Suspense } from "react";
import FlickReelsWatchClient from "./FlickReelsWatchClient";

export function generateStaticParams() {
  return []; // Client-side only - no pre-rendering
}

function LoadingFallback() {
  return (
    <main className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
    </main>
  );
}

export default function FlickReelsWatchPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <FlickReelsWatchClient />
    </Suspense>
  );
}
