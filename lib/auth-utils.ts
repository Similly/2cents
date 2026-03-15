import {redirect} from "next/navigation";
import {auth} from "@/auth";
import {routing} from "@/i18n/routing";

export async function requireAdmin(locale?: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    const loginPath =
      locale && locale !== routing.defaultLocale ? `/${locale}/login` : "/login";
    redirect(loginPath);
  }

  return session;
}
