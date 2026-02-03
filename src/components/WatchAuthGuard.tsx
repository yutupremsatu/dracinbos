"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Lock, LogIn } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface WatchAuthGuardProps {
    children: React.ReactNode;
}

export function WatchAuthGuard({ children }: WatchAuthGuardProps) {
    const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = loading
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    useEffect(() => {
        // Quick sync check first (from localStorage cache)
        const checkAuthQuick = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setUser(session?.user ?? null);
            } catch {
                setUser(null);
            }
        };

        checkAuthQuick();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogin = useCallback(async () => {
        setIsLoggingIn(true);

        // Save current URL to redirect back after login
        const currentUrl = window.location.href;
        localStorage.setItem('redirectAfterLogin', currentUrl);

        // Redirect to Google OAuth
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            }
        });
    }, []);

    // Still checking auth - show children with blur overlay (feels faster)
    if (user === undefined) {
        return (
            <div className="relative">
                {/* Show blurred children so page feels like it's loading */}
                <div className="blur-sm pointer-events-none">
                    {children}
                </div>
                {/* Loading overlay */}
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    // Not logged in - show login prompt
    if (!user) {
        return (
            <main className="fixed inset-0 bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
                <div className="max-w-md w-full text-center">
                    {/* Lock Icon */}
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
                        <Lock className="w-10 h-10 text-primary" />
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-white mb-2">
                        Login untuk Menonton
                    </h1>

                    {/* Description */}
                    <p className="text-gray-400 mb-8">
                        Silakan login dengan akun Google untuk menonton video ini. Gratis dan cepat!
                    </p>

                    {/* Login Button */}
                    <button
                        onClick={handleLogin}
                        disabled={isLoggingIn}
                        className="w-full bg-gradient-to-r from-primary to-purple-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-lg shadow-primary/25 disabled:opacity-70"
                    >
                        {isLoggingIn ? (
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <svg className="w-6 h-6" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                        )}
                        {isLoggingIn ? "Memproses..." : "Login dengan Google"}
                    </button>

                    {/* Back Link */}
                    <button
                        onClick={() => window.history.back()}
                        className="mt-6 text-gray-500 hover:text-gray-300 transition-colors text-sm"
                    >
                        ← Kembali
                    </button>
                </div>
            </main>
        );
    }

    // Logged in - render children (the video player)
    return <>{children}</>;
}
