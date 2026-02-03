// Server component with generateStaticParams for Next.js static export
import FreeReelsWatchClient from "./FreeReelsWatchClient";

export function generateStaticParams() {
  return []; // Client-side only - no pre-rendering
}

export default function FreeReelsWatchPage() {
  return <FreeReelsWatchClient />;
}
