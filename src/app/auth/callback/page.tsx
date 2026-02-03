"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, CheckCircle, ExternalLink } from "lucide-react";

function AuthCallbackContent() {
    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'manual'>('loading');
    const [message, setMessage] = useState('Memproses login...');
    const [deepLinkUrl, setDeepLinkUrl] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const error_description = searchParams.get("error_description");

    useEffect(() => {
        handleAuthCallback();
    }, []);

    const handleAuthCallback = async () => {
        if (error) {
            console.error("Auth Error:", error, error_description);
            setStatus('error');
            setMessage(error_description || 'Login gagal');
            setTimeout(() => router.push("/"), 2000);
            return;
        }

        try {
            // Check for hash params (OAuth returns tokens in hash for implicit flow)
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');

            if (accessToken && refreshToken) {
                // Set session in browser context first
                const { error: sessionError } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken
                });

                if (sessionError) {
                    throw sessionError;
                }

                setStatus('success');
                setMessage('Login berhasil!');

                // For APK: Redirect to mobile-callback page with tokens in URL
                // This page will run in APK's WebView and can set the session there
                const mobileCallbackUrl = `https://dracinbos.vercel.app/auth/mobile-callback?access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}`;

                // Custom scheme deep link
                const appDeepLink = `dracinku://auth?access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}`;
                setDeepLinkUrl(appDeepLink);

                setTimeout(() => {
                    // Try deep link first
                    window.location.href = appDeepLink;

                    // If deep link doesn't work (still on page after 1s), redirect to HTTPS callback
                    setTimeout(() => {
                        window.location.href = mobileCallbackUrl;
                    }, 1000);
                }, 500);

            } else if (code) {
                // Code-based flow (PKCE) - exchange code for session
                const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

                if (sessionError) {
                    throw sessionError;
                }

                if (data?.session) {
                    setStatus('success');
                    setMessage('Login berhasil!');

                    // Redirect to mobile-callback with fresh tokens
                    const mobileCallbackUrl = `https://dracinbos.vercel.app/auth/mobile-callback?access_token=${encodeURIComponent(data.session.access_token)}&refresh_token=${encodeURIComponent(data.session.refresh_token)}`;

                    const appDeepLink = `dracinku://auth?access_token=${encodeURIComponent(data.session.access_token)}&refresh_token=${encodeURIComponent(data.session.refresh_token)}`;
                    setDeepLinkUrl(appDeepLink);

                    setTimeout(() => {
                        window.location.href = appDeepLink;
                        setTimeout(() => {
                            window.location.href = mobileCallbackUrl;
                        }, 1000);
                    }, 500);
                } else {
                    throw new Error('No session returned');
                }
            } else {
                // Check if session already exists
                const { data: { session } } = await supabase.auth.getSession();

                if (session) {
                    setStatus('success');
                    setMessage('Login berhasil!');
                    setTimeout(() => router.push('/'), 1000);
                } else {
                    router.push('/');
                }
            }
        } catch (err: any) {
            console.error('Auth callback error:', err);
            setStatus('error');
            setMessage(err.message || 'Terjadi kesalahan');
            setTimeout(() => router.push('/'), 2000);
        }
    };

    const openApp = () => {
        if (deepLinkUrl) {
            window.location.href = deepLinkUrl;
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center px-4 bg-gray-950">
            <div className="text-center max-w-md w-full">
                {status === 'loading' && (
                    <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
                )}
                {(status === 'success' || status === 'manual') && (
                    <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                )}
                {status === 'error' && (
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">❌</span>
                    </div>
                )}
                <p className="text-xl text-white font-medium mb-4">{message}</p>

                {status === 'manual' && deepLinkUrl && (
                    <div className="space-y-4">
                        <p className="text-gray-400 text-sm">
                            Tekan tombol di bawah untuk kembali ke aplikasi, atau tutup tab ini dan buka aplikasi secara manual.
                        </p>

                        <button
                            onClick={openApp}
                            className="w-full bg-gradient-to-r from-primary to-purple-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition"
                        >
                            <ExternalLink className="w-5 h-5" />
                            Buka Aplikasi
                        </button>

                        <button
                            onClick={() => window.close()}
                            className="w-full bg-white/10 text-white font-medium py-3 px-6 rounded-xl hover:bg-white/20 transition"
                        >
                            Tutup Tab Ini
                        </button>

                        <p className="text-gray-500 text-xs mt-6">
                            Jika aplikasi tidak terbuka otomatis, tutup browser ini dan buka aplikasi Dracinku.
                        </p>
                    </div>
                )}

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
