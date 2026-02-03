"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const error_description = searchParams.get("error_description");

    useEffect(() => {
        if (error) {
            console.error("Auth Error:", error, error_description);
            router.push("/"); // Back to home on error
            return;
        }

        const handleAuth = async () => {
            if (code) {
                try {
                    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
                    if (sessionError) {
                        console.error("Session Exchange Error:", sessionError);
                    }
                } catch (err) {
                    console.error("Auth Exception:", err);
                }
            }
            // Always redirect to home, successful or not (state listener will pick up session)
            router.push("/");
        };

        handleAuth();
    }, [code, error, error_description, router]);

    return (
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-gray-400">Menyelesaikan login...</p>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
            <Suspense fallback={<div className="w-8 h-8 rounded-full bg-muted animate-pulse" />}>
                <AuthCallbackContent />
            </Suspense>
        </div>
    );
}
