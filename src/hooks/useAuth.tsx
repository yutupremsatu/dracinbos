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
            // 1. Detect Platform
            if (Capacitor.isNativePlatform()) {
                console.log("Native Platform Detected: Using Capacitor Google Auth");
                // Import dynamically to avoid SSR issues
                const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');

                // A. Native Popup
                const user = await GoogleAuth.signIn();
                console.log("Native Login Success:", user);

                // B. Get ID Token
                const idToken = user.authentication.idToken;

                // C. Exchange for Supabase Session
                const { data, error } = await supabase.auth.signInWithIdToken({
                    provider: 'google',
                    token: idToken,
                });

                if (error) throw error;

                // Force sync user after native login
                if (data.session?.user) {
                    await syncUserToDatabase(data.session.user);
                }

            } else {
                console.log("Web Platform Detected: Using Standard OAuth Redirect");
                // Always use production URL for OAuth redirect
                const redirectUrl = process.env.NODE_ENV === 'production'
                    ? 'https://dracinbos.vercel.app/auth/callback'
                    : (typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined);

                const { error } = await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: {
                        redirectTo: redirectUrl,
                    },
                });
                if (error) throw error;
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
