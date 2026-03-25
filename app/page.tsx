import { headers } from "next/headers";
import MapView from "@/components/Map/MapView";

export default async function Home() {
  const hdrs = await headers();
  const ua = hdrs.get("user-agent") ?? "";
  const initialIsMobile = /mobile|android|iphone|ipad|ipod/i.test(ua);
  return <MapView initialIsMobile={initialIsMobile} />;
}
