import TransparencyTest from "@/components/overlay/TransparencyTest";
import { parseOverlayParams } from "@/lib/overlay/params";

// Setup page for streaming apps: /overlay/test (optionally ?bg=chroma|solid).
// Not linked from the public site.
export default function OverlayTestPage({ searchParams }) {
  const { bg } = parseOverlayParams(searchParams);
  return <TransparencyTest bg={bg} />;
}
