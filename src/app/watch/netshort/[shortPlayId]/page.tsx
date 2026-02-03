// Server component with generateStaticParams for Next.js static export
import NetShortWatchClient from "./NetShortWatchClient";

export function generateStaticParams() {
  return []; // Client-side only - no pre-rendering
}

export default function NetShortWatchPage() {
  return <NetShortWatchClient />;
}
