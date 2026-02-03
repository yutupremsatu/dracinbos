// Server component with generateStaticParams for Next.js static export
import FlickReelsDetailClient from "./FlickReelsDetailClient";

export function generateStaticParams() {
  return []; // Client-side only - no pre-rendering
}

export default function FlickReelsDetailPage() {
  return <FlickReelsDetailClient />;
}
