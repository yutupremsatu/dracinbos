"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function GenresPage() {
    return (
        <main className="min-h-screen pt-24 pb-20 container mx-auto px-4 flex flex-col items-center justify-center text-center">
            <h1 className="text-3xl font-display font-bold text-white mb-4">Genres</h1>
            <p className="text-gray-400 mb-8 max-w-md">
                We are organizing our library into genres. Check back soon for better discovery!
            </p>

            <Link href="/" className="px-6 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform inline-flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
            </Link>
        </main>
    );
}
