import {Sidebar} from "@/components/public/sidebar";

export default function PublicLayout({children}: {children: React.ReactNode}) {
  return (
    <div className="min-h-screen bg-site lg:flex">
      <Sidebar />
      <main className="mx-auto w-full max-w-[1024px] px-6 pb-10 pt-8 lg:px-8 lg:pt-16">{children}</main>
    </div>
  );
}
