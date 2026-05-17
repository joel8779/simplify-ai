import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { BRAND_TAGLINE } from "@/lib/constants/brand";
import { MARKETING_NAV, ROUTES } from "@/lib/constants/navigation";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-card/20">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo size="sm" />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              {BRAND_TAGLINE}. Built for teams who need accurate, cited answers
              from their knowledge base.
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-foreground">Product</p>
            <ul className="mt-4 space-y-2">
              {MARKETING_NAV.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-medium text-foreground">Account</p>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href={ROUTES.login}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Log in
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.signup}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Get Started
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border/40 pt-8">
          <p className="text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Simplify. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
