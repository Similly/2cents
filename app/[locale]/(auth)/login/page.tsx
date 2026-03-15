import {AuthError} from "next-auth";
import {redirect} from "next/navigation";
import {getTranslations} from "next-intl/server";
import {signIn} from "@/auth";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{locale: "de" | "en"}>;
  searchParams: Promise<{error?: string; callbackUrl?: string}>;
}) {
  const {locale} = await params;
  const resolvedSearch = await searchParams;
  const t = await getTranslations("login");
  const defaultEditorPath = locale === "de" ? "/editor" : `/${locale}/editor`;

  const callbackPath = (() => {
    if (!resolvedSearch.callbackUrl) return defaultEditorPath;
    try {
      const parsed = new URL(resolvedSearch.callbackUrl, "http://localhost");
      const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
      if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/api/auth")) {
        return defaultEditorPath;
      }
      return path;
    } catch {
      return defaultEditorPath;
    }
  })();

  return (
    <div className="grid min-h-screen place-items-center bg-site p-6">
      <div className="w-full max-w-md rounded-2xl border border-site-border bg-white p-8">
        <h1 className="text-5xl">{t("title")}</h1>
        <p className="mt-2 text-site-muted">{t("description")}</p>

        <form
          action={async (formData) => {
            "use server";
            try {
              const email = String(formData.get("email") || "").trim().toLowerCase();
              const password = String(formData.get("password") || "");
              await signIn("credentials", {
                email,
                password,
                redirectTo: callbackPath,
              });
              // Some deployments do not auto-redirect after successful credentials sign-in.
              // Force navigation to the editor as a safe fallback.
              redirect(callbackPath);
            } catch (error) {
              if (error instanceof AuthError) {
                redirect(`${locale === "de" ? "" : `/${locale}`}/login?error=CredentialsSignin`);
              }
              throw error;
            }
          }}
          className="mt-6 space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm text-site-muted">{t("email")}</label>
            <Input name="email" required type="email" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-site-muted">{t("password")}</label>
            <Input name="password" required type="password" />
          </div>
          <Button className="w-full" type="submit">
            {t("submit")}
          </Button>
        </form>

        {resolvedSearch.error ? <p className="mt-3 text-sm text-red-600">{t("error")}</p> : null}
      </div>
    </div>
  );
}
