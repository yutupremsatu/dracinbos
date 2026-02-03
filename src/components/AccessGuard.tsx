"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Lock, LogIn, Crown } from "lucide-react";

interface AccessGuardProps {
    children: React.ReactNode;
}

export function AccessGuard({ children }: AccessGuardProps) {
    const { user, loading: authLoading, signInWithGoogle } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Parallel fetch for speed
                const [configRes, profileRes] = await Promise.all([
                    fetch("/api/admin/config"),
                    user ? fetch(`/api/user/profile`) : Promise.resolve(null)
                ]);

                if (configRes.ok) {
                    const configData = await configRes.ok ? await configRes.json() : {};
                    setConfig(configData);
                }

                if (profileRes && profileRes.ok) {
                    const profileData = await profileRes.json();
                    setProfile(profileData);
                }
            } catch (err) {
                console.error("AccessGuard error:", err);
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) {
            fetchData();
        }
    }, [user, authLoading]);

    if (authLoading || loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Level 1: Must be logged in
    useEffect(() => {
        if (!authLoading && !loading && !user) {
            signInWithGoogle();
        }
    }, [authLoading, loading, user, signInWithGoogle]);

    if (!user) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center p-8 bg-gray-900/50 rounded-2xl border border-gray-800 text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6">
                    <LogIn className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Login Diperlukan</h2>
                <p className="text-gray-400 mb-8 max-w-sm">
                    Halaman ini memerlukan akses akun. Membuka halaman login Google...
                </p>
                <button
                    onClick={signInWithGoogle}
                    className="flex items-center gap-3 px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-all shadow-xl shadow-white/5"
                >
                    <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="" />
                    Login with Google
                </button>
                <div className="mt-6 animate-pulse text-primary text-sm font-medium">
                    Redirecting to Google Login...
                </div>
            </div>
        );
    }

    // Level 2: Premium Mode Check
    const isPremiumMode = config?.premium_mode === 'on';
    const isWhitelisted = profile?.is_whitelisted || profile?.is_premium;

    if (isPremiumMode && !isWhitelisted) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center p-8 bg-gray-900/50 rounded-2xl border border-gray-800 text-center overflow-hidden relative">
                <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />

                <div className="relative">
                    <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-6 border border-yellow-500/30">
                        <Crown className="w-8 h-8 text-yellow-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Khusus Member Premium</h2>
                    <p className="text-gray-400 mb-8 max-w-sm">
                        Mode Premium sedang diaktifkan. Drama ini hanya bisa ditonton oleh pengguna yang masuk dalam daftar Whitelist atau memiliki akses Premium.
                    </p>
                    <button
                        className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-black rounded-full font-bold hover:scale-105 transition-all shadow-lg shadow-yellow-500/20"
                        onClick={() => alert("Segera Hadir: Fitur Upgrade Otomatis!")}
                    >
                        <Lock className="w-5 h-5" />
                        Upgrade Premium
                    </button>
                    <p className="mt-6 text-sm text-gray-500">
                        Sudah transfer? Hubungi admin untuk aktivasi manual.
                    </p>
                </div>
            </div>
        );
    }

    // Access granted
    return <>{children}</>;
}
