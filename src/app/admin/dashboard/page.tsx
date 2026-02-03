"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Film,
    Settings,
    LogOut,
    Database,
    Activity,
    TrendingUp
} from "lucide-react";
import { AdminLayout } from "../components/AdminLayout";

interface Stats {
    totalDramas: number;
    totalUsers: number;
    totalPlatforms: number;
    lastSync: string;
    apkUrl?: string; // Derived from config
}

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const isAdmin = sessionStorage.getItem("admin_authenticated");
        if (isAdmin !== "true") {
            router.replace("/admin");
            return;
        }

        // Fetch stats
        fetchStats();
    }, [router]);

    const fetchStats = async () => {
        try {
            const [statsRes, configRes] = await Promise.all([
                fetch("/api/admin/stats"),
                fetch("/api/admin/config")
            ]);

            if (statsRes.ok && configRes.ok) {
                const statsData = await statsRes.json();
                const configData = await configRes.json();
                setStats({ ...statsData, apkUrl: configData.apk_url });
            }
        } catch (err) {
            console.error("Failed to fetch stats:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <AdminLayout title="Dashboard">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Total Drama</p>
                            <p className="text-3xl font-bold text-white">{stats?.totalDramas ?? "-"}</p>
                        </div>
                        <Film className="w-10 h-10 text-primary opacity-50" />
                    </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Total Pengguna</p>
                            <p className="text-3xl font-bold text-white">{stats?.totalUsers ?? "-"}</p>
                        </div>
                        <Users className="w-10 h-10 text-green-500 opacity-50" />
                    </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Platform</p>
                            <p className="text-3xl font-bold text-white">{stats?.totalPlatforms ?? 6}</p>
                        </div>
                        <Database className="w-10 h-10 text-yellow-500 opacity-50" />
                    </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Last Sync</p>
                            <p className="text-lg font-bold text-white">{stats?.lastSync ?? "Never"}</p>
                        </div>
                        <Activity className="w-10 h-10 text-blue-500 opacity-50" />
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => fetch("/api/cron").then(() => fetchStats())}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
                    >
                        🔄 Trigger Sync
                    </button>
                    <button className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
                        📊 Export Data
                    </button>
                    <button className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
                        🧹 Clear Cache
                    </button>
                </div>
            </div>
        </AdminLayout>
    );
}
