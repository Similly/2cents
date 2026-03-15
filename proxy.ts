import {NextResponse, type NextRequest} from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import {getToken} from "next-auth/jwt";
import {routing} from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

function isProtectedPath(pathname: string) {
  return /(^\/(de|en))?\/editor(\/|$)/.test(pathname);
}

function isLoginPath(pathname: string) {
  return /(^\/(de|en))?\/login(\/|$)/.test(pathname);
}

function extractLocale(pathname: string) {
  const match = pathname.match(/^\/(de|en)(\/|$)/);
  return match?.[1] || routing.defaultLocale;
}

function withLocalePath(locale: string, path: string) {
  return locale === routing.defaultLocale ? path : `/${locale}${path}`;
}

async function readAuthToken(req: NextRequest) {
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const isSecure = req.nextUrl.protocol === "https:" || forwardedProto === "https";
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) return null;

  return getToken({
    req,
    secret,
    secureCookie: isSecure,
  });
}

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (isProtectedPath(pathname)) {
    const token = await readAuthToken(req);

    if (!token) {
      const locale = extractLocale(pathname);
      const login = new URL(withLocalePath(locale, "/login"), req.url);
      login.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
      return NextResponse.redirect(login);
    }
  }

  if (isLoginPath(pathname)) {
    const token = await readAuthToken(req);
    if (token) {
      const locale = extractLocale(pathname);
      return NextResponse.redirect(new URL(withLocalePath(locale, "/editor"), req.url));
    }
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
