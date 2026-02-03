// Server component with generateStaticParams for Next.js static export
import ReelShortDetailClient from "./ReelShortDetailClient";

export function generateStaticParams() {
  return []; // Client-side only - no pre-rendering
}

export default function ReelShortDetailPage() {
  return <ReelShortDetailClient />;
}
