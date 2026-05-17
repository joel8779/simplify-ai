import { MarketingLayoutShell } from "@/components/marketing/MarketingLayoutShell";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MarketingLayoutShell>{children}</MarketingLayoutShell>;
}
