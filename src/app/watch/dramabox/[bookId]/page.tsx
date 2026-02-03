// Server component with generateStaticParams for Next.js static export
import DramaBoxWatchClient from "./DramaBoxWatchClient";

export function generateStaticParams() {
  return []; // Client-side only - no pre-rendering
}

export default function DramaBoxWatchPage() {
  return <DramaBoxWatchClient />;
}
