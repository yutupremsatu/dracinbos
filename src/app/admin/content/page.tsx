"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "../components/AdminLayout";
import { Trash2, Search, ExternalLink, Eye } from "lucide-react";

export default function AdminContentPage() {
    const [dramas, setDramas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [total, setTotal] = useState(0);

    useEffect(() => {
        fetchDramas();
    }, [page, search]);

    const fetchDramas = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                search
            });
            const res = await fetch(`/api/admin/content?${params}`, {
                headers: {
                    'x-admin-secret': 'G@cor123'
                }
            });
            if (res.ok) {
                const data = await res.json();
                setDramas(data.dramas || []);
                setTotal(data.total || 0);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this drama?')) return;

        try {
            const res = await fetch('/api/admin/content', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-secret': 'G@cor123'
                },
                body: JSON.stringify({ id })
            });

            if (res.ok) {
                alert('Drama deleted');
                fetchDramas();
            } else {
                alert('Failed to delete');
            }
        } catch (e) {
            alert('Error deleting');
        }
    }

    return (
        <AdminLayout title="Kelola Konten">
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden flex flex-col h-[calc(100vh-150px)]">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-700 flex justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search title..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left bg-gray-900">
                        <thead className="bg-gray-700 text-gray-200 sticky top-0 z-10">
                            <tr>
                                <th className="p-4 w-16">ID</th>
                                <th className="p-4">Cover</th>
                                <th className="p-4">Title</th>
                                <th className="p-4">Views</th>
                                <th className="p-4 w-24">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {dramas.map((drama) => (
                                <tr key={drama.id} className="hover:bg-gray-800/50">
                                    <td className="p-4 text-gray-400 text-sm">#{drama.id}</td>
                                    <td className="p-4">
                                        <div className="w-12 h-16 bg-gray-800 rounded overflow-hidden relative">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={drama.poster_url} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    </td>
                                    <td className="p-4 font-medium text-white">
                                        {drama.title}
                                        <div className="text-xs text-gray-500 mt-1">{drama.category} • {new Date(drama.created_at).toLocaleDateString()}</div>
                                    </td>
                                    <td className="p-4 text-gray-400 text-sm">
                                        {drama.view_count || 0}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleDelete(drama.id)}
                                                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-gray-700 flex justify-between items-center text-sm text-gray-400">
                    <div>Total: {total}</div>
                    <div className="flex gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50"
                        >
                            Prev
                        </button>
                        <span className="px-2 py-1">Page {page}</span>
                        <button
                            disabled={dramas.length < 20}
                            onClick={() => setPage(p => p + 1)}
                            className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
