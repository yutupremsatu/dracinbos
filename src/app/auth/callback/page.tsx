"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, CheckCircle } from "lucide-react";

function AuthCallbackContent() {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Memproses login...');
    const router = useRouter();

    useEffect(() => {
        // Listen for auth state changes - this will fire when Supabase processes the OAuth callback
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth event:', event, session ? 'has session' : 'no session');

            if (event === 'SIGNED_IN' && session) {
                setStatus('success');
                setMessage('Login berhasil!');
                // Redirect to homepage after successful login
                setTimeout(() => {
                    router.push('/');
                }, 1000);
            } else if (event === 'SIGNED_OUT') {
                router.push('/');
            }
        });

        // Also check if we're already logged in
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                setStatus('success');
                setMessage('Login berhasil!');
                setTimeout(() => {
                    router.push('/');
                }, 1000);
            } else {
                // No session yet - wait for onAuthStateChange to fire
                // If nothing happens after 5 seconds, redirect anyway
                setTimeout(() => {
                    router.push('/');
                }, 5000);
            }
        };

        // Small delay to let Supabase process the hash
        setTimeout(checkSession, 500);

        return () => {
            subscription.unsubscribe();
        };
    }, [router]);

    return (
        <main className="min-h-screen flex items-center justify-center px-4 bg-gray-950">
            <div className="text-center max-w-md w-full">
                {status === 'loading' && (
                    <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
                )}
                {status === 'success' && (
                    <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                )}
                {status === 'error' && (
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">❌</span>
                    </div>
                )}
                <p className="text-xl text-white font-medium mb-4">{message}</p>

                {status === 'loading' && (
                    <p className="text-gray-400 mt-2">Mohon tunggu sebentar...</p>
                )}
            </div>
        </main>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen flex items-center justify-center bg-gray-950">
                <Loader2 className="w-16 h-16 animate-spin text-primary" />
            </main>
        }>
            <AuthCallbackContent />
        </Suspense>
    );
}
