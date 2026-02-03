"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { Capacitor } from "@capacitor/core";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);

                // Sync user to database on sign in
                if (event === "SIGNED_IN" && session?.user) {
                    await syncUserToDatabase(session.user);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const syncUserToDatabase = async (user: User) => {
        try {
            const { error } = await supabase.from("users").upsert({
                id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name || user.email?.split("@")[0],
                avatar_url: user.user_metadata?.avatar_url,
                provider: user.app_metadata?.provider || "email",
                last_login: new Date().toISOString(),
            }, { onConflict: "id" });

            if (error) console.error("Error syncing user:", error);
        } catch (err) {
            console.error("User sync failed:", err);
        }
    };

    const signInWithGoogle = async () => {
        try {
            // Always use production URL for OAuth redirect
            const redirectUrl = 'https://dracinbos.vercel.app/auth/callback';

            // Detect if running natively
            const isNative = Capacitor.isNativePlatform();

            // DEBUG ALERT (User asked to debug)
            alert(`Debug Mode: ${isNative ? "NATIVE (In-App)" : "WEB (External)"}`);

            console.log(`Starting Login Flow. Native: ${isNative}`);

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: redirectUrl,
                    skipBrowserRedirect: isNative, // If native, SKIP automatic redirect
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    }
                },
            });

            if (error) throw error;

            if (isNative && data?.url) {
                // Open auth URL in In-App Browser (Chrome Custom Tags)
                console.log("Opening In-App Browser:", data.url);
                try {
                    const { Browser } = await import('@capacitor/browser');
                    await Browser.open({ url: data.url });
                } catch (e) {
                    alert("Failed to open Browser plugin: " + e);
                    // Fallback to standard redirect if plugin fails
                    window.location.href = data.url;
                }
            }
        } catch (error) {
            console.error("Google sign-in error:", error);
        }
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) console.error("Sign out error:", error);
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, signInWithGoogle, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
