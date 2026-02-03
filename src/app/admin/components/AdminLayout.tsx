"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Film,
    Settings,
    LogOut,
    Menu,
    X
} from "lucide-react";

interface AdminLayoutProps {
    children: React.ReactNode;
    title: string;
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const isAdmin = sessionStorage.getItem("admin_authenticated");
        if (isAdmin !== "true") {
            router.replace("/admin");
        }
    }, [router]);

    const handleLogout = () => {
        sessionStorage.removeItem("admin_authenticated");
        router.push("/admin");
    };

    const isActive = (path: string) => pathname === path;

    return (
        <div className="min-h-screen bg-gray-900 flex">
            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 border-r border-gray-700 p-4 transition-transform duration-300
                ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
            `}>
                <div className="mb-8 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-white">🎬 Dracinku Admin</h1>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="space-y-2">
                    <NavItem href="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" active={isActive("/admin/dashboard")} />
                    <NavItem href="/admin/users" icon={Users} label="Pengguna" active={isActive("/admin/users")} />
                    <NavItem href="/admin/content" icon={Film} label="Konten" active={isActive("/admin/content")} />
                    <NavItem href="/admin/settings" icon={Settings} label="Pengaturan" active={isActive("/admin/settings")} />
                </nav>

                <div className="absolute bottom-4 left-4 right-4">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors w-full"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Keluar</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-4 md:p-8 min-h-screen w-full">
                <header className="flex items-center gap-4 mb-6 md:hidden">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 text-white bg-gray-800 rounded-lg">
                        <Menu className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold text-white">{title}</h1>
                </header>

                <div className="hidden md:block mb-6">
                    <h2 className="text-2xl font-bold text-white">{title}</h2>
                </div>

                {children}
            </main>
        </div>
    );
}

function NavItem({ href, icon: Icon, label, active }: any) {
    return (
        <a
            href={href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${active
                    ? "text-white bg-primary/20"
                    : "text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
        >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
        </a>
    );
}
