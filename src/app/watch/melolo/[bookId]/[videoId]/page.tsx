// Server component with generateStaticParams for Next.js static export
import MeloloWatchClient from "./MeloloWatchClient";

export function generateStaticParams() {
  return []; // Client-side only - no pre-rendering
}

export default function MeloloWatchPage() {
  return <MeloloWatchClient />;
}
