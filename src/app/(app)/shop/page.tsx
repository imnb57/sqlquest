import type { Metadata } from "next";
import { ShopView } from "@/components/gamification/shop-view";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Shop",
  description:
    "Spend the gems you've earned on heart refills, streak freezes and XP boosts. Everything is earned in-app — there's nothing to buy with money.",
  path: "/shop",
});

export default function ShopPage() {
  return <ShopView />;
}
