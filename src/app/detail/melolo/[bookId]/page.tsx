// Server component with generateStaticParams for Next.js static export
import MeloloDetailClient from "./MeloloDetailClient";

export function generateStaticParams() {
  return []; // Client-side only - no pre-rendering
}

export default function MeloloDetailPage() {
  return <MeloloDetailClient />;
}
