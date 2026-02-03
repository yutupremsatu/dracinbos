// Server component with generateStaticParams for Next.js static export
import ReelShortWatchClient from "./ReelShortWatchClient";

export function generateStaticParams() {
  return []; // Client-side only - no pre-rendering
}

export default function ReelShortWatchPage() {
  return <ReelShortWatchClient />;
}
