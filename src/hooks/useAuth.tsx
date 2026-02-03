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

    // Handle Deep Links (for Native Login Callback)
    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            import('@capacitor/app').then(({ App }) => {
                App.addListener('appUrlOpen', async (data) => {
                    console.log('App opened with URL:', data.url);

                    // Close browser first
                    try {
                        const { Browser } = await import('@capacitor/browser');
                        await Browser.close();
                    } catch (e) { console.log('Browser close error (harmless):', e); }

                    // Parse URL safely
                    let url: URL;
                    try {
                        url = new URL(data.url);
                    } catch {
                        console.error('Invalid URL:', data.url);
                        return;
                    }

                    // Handle dracinku://auth?access_token=...&refresh_token=...
                    if (data.url.startsWith('dracinku://auth')) {
                        const accessToken = url.searchParams.get('access_token');
                        const refreshToken = url.searchParams.get('refresh_token');

                        if (accessToken && refreshToken) {
                            console.log('Setting session from deep link tokens...');
                            const { error } = await supabase.auth.setSession({
                                access_token: accessToken,
                                refresh_token: refreshToken
                            });

                            if (error) {
                                alert('Login Error: ' + error.message);
                            } else {
                                console.log('Native Login Success via deep link!');
                                window.location.reload(); // Refresh to update UI
                            }
                        }
                    }
                    // Handle https://dracinbos.vercel.app/auth/callback?code=...
                    else if (data.url.includes('auth/callback')) {
                        const code = url.searchParams.get('code');

                        if (code) {
                            console.log('Exchanging code for session...');
                            const { error } = await supabase.auth.exchangeCodeForSession(code);
                            if (error) {
                                alert('Login Error: ' + error.message);
                            } else {
                                console.log('Native Login Success via code!');
                                window.location.reload();
                            }
                        }
                    }
                    // Handle https://dracinbos.vercel.app/auth/mobile-callback?access_token=...
                    else if (data.url.includes('mobile-callback')) {
                        const accessToken = url.searchParams.get('access_token');
                        const refreshToken = url.searchParams.get('refresh_token');

                        if (accessToken && refreshToken) {
                            console.log('Setting session from mobile-callback tokens...');
                            const { error } = await supabase.auth.setSession({
                                access_token: accessToken,
                                refresh_token: refreshToken
                            });

                            if (error) {
                                alert('Login Error: ' + error.message);
                            } else {
                                console.log('Native Login Success via mobile-callback!');
                                window.location.reload();
                            }
                        }
                    }
                });
            });
        }
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
            // Detect if running natively
            const isNative = Capacitor.isNativePlatform();

            console.log(`Starting Login Flow. Native: ${isNative}`);

            // 1. Try Native Login first if on Capacitor (shows Google One Tap popup)
            if (isNative) {
                try {
                    const { signInWithGoogleNative } = await import('@/utils/native-auth');
                    const { data, error } = await signInWithGoogleNative();

                    if (error) throw error;

                    if (data?.session) {
                        console.log('Native Login Success!');
                        window.location.reload(); // Reload to update UI
                        return;
                    }
                } catch (err: any) {
                    console.error('Native login failed, falling back to web:', err);
                    // Continue to web fallback below
                }
            }

            // 2. Web Login Fallback (or if native fails/not available)
            const redirectUrl = 'https://dracinbos.vercel.app/auth/callback';

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: redirectUrl,
                    skipBrowserRedirect: isNative,
                    queryParams: {
                        prompt: 'select_account',
                    }
                },
            });

            if (error) throw error;

            // For web, the default redirect will happen automatically
            // For native app, we skipped it, so we must open it manually
            if (isNative && data?.url) {
                try {
                    const { Browser } = await import('@capacitor/browser');

                    // Listen for browser close/finish
                    Browser.addListener('browserFinished', () => {
                        // Check if user is now logged in
                        supabase.auth.getSession().then(({ data: { session } }) => {
                            if (session) {
                                console.log('Native Login Success via browserFinished!');
                                window.location.reload();
                            }
                        });
                    });

                    // Open in system browser (more reliable for OAuth)
                    await Browser.open({
                        url: data.url,
                        windowName: '_system'
                    });
                } catch (e) {
                    console.error('Browser plugin error:', e);
                    window.location.href = data.url;
                }
            }
        } catch (error) {
            console.error("Google sign-in error:", error);
        }
    };

    const signOut = async () => {
        // 1. Native Sign Out (if applicable)
        if (Capacitor.isNativePlatform()) {
            try {
                const { signOutNative } = await import('@/utils/native-auth');
                await signOutNative();
            } catch (e) {
                console.error('Native sign out error:', e);
            }
        }

        // 2. Supabase Sign Out (removes session)
        const { error } = await supabase.auth.signOut();
        if (error) console.error("Sign out error:", error);

        // 3. Force reload to clear any React state
        window.location.reload();
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
