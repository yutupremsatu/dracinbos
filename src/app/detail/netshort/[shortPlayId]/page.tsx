// Server component with generateStaticParams for Next.js static export
import NetShortDetailClient from "./NetShortDetailClient";

export function generateStaticParams() {
  return []; // Client-side only - no pre-rendering
}

export default function NetShortDetailPage() {
  return <NetShortDetailClient />;
}
