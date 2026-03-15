import {redirect} from "next/navigation";
import {auth} from "@/auth";
import {routing} from "@/i18n/routing";

export async function requireAdmin(locale?: string) {
  const session = await auth();
  const role = session?.user?.role;
  const isAdmin = Boolean(session?.user) && (role === undefined || role === "ADMIN");

  if (!isAdmin) {
    const loginPath =
      locale && locale !== routing.defaultLocale ? `/${locale}/login` : "/login";
    redirect(loginPath);
  }

  return session;
}
