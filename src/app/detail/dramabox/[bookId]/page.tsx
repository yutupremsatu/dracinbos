// Server component with generateStaticParams for Next.js static export
import DramaBoxDetailClient from "./DramaBoxDetailClient";

export function generateStaticParams() {
  return []; // Client-side only - no pre-rendering
}

export default function DramaBoxDetailPage() {
  return <DramaBoxDetailClient />;
}
