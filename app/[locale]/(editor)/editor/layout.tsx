import {ArrowLeft, PenSquare} from "lucide-react";
import {auth, signOut} from "@/auth";
import {Button} from "@/components/ui/button";
import {Link} from "@/i18n/navigation";

export default async function EditorLayout({children}: {children: React.ReactNode}) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-site">
      <header className="border-b border-site-border bg-white">
        <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link className="rounded-md p-2 hover:bg-site-pill" href="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <p className="font-serif text-3xl text-site-ink">
              2cents <span className="px-2 text-site-muted">/</span> Editor
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-site-muted">
            <span>{session?.user?.email}</span>
            <form
              action={async () => {
                "use server";
                await signOut({redirectTo: "/login"});
              }}
            >
              <Button size="sm" type="submit" variant="outline">
                <PenSquare className="mr-2 h-4 w-4" /> Logout
              </Button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
