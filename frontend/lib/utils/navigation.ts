export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  if (href === "/chat") {
    return pathname === "/chat" || pathname.startsWith("/chat/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function shouldShowBackButton(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length <= 1) return false;

  const topLevel = segments[0];
  if (topLevel === "chat" && segments.length > 1) return true;
  if (topLevel === "documents" && segments.length > 1) return true;
  if (topLevel === "login" || topLevel === "signup" || topLevel === "forgot-password") {
    return true;
  }

  return false;
}

export function getBackFallback(pathname: string): string {
  if (pathname.startsWith("/chat/")) return "/chat";
  if (pathname.startsWith("/documents/")) return "/documents";
  if (pathname.startsWith("/login") || pathname.startsWith("/signup")) return "/";
  return "/dashboard";
}
