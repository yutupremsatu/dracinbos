// Server component with generateStaticParams for Next.js static export
import FlickReelsWatchClient from "./FlickReelsWatchClient";

export function generateStaticParams() {
  return []; // Client-side only - no pre-rendering
}

export default function FlickReelsWatchPage() {
  return <FlickReelsWatchClient />;
}
