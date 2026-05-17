import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/navigation";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-4xl font-semibold">404</h1>
      <p className="text-muted-foreground">Page not found</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="outline" asChild>
          <Link href={ROUTES.home}>Back to home</Link>
        </Button>
        <Button asChild>
          <Link href={ROUTES.chat}>Go to chat</Link>
        </Button>
      </div>
    </div>
  );
}
