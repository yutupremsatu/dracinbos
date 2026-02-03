// Server component with generateStaticParams for Next.js static export
import FreeReelsDetailClient from "./FreeReelsDetailClient";

export function generateStaticParams() {
  return []; // Client-side only - no pre-rendering
}

export default function FreeReelsDetailPage() {
  return <FreeReelsDetailClient />;
}
