import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-slate-100 flex">
            <Sidebar />
            <main className="flex-1 lg:ml-0 overflow-auto">
                <div className="p-4 lg:p-8 pt-16 lg:pt-8">{children}</div>
            </main>
        </div>
    );
}
