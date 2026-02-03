"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Trash2, Mail, Calendar } from "lucide-react";
import { AdminLayout } from "@/app/admin/components/AdminLayout";

export default function AdminUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/admin/users", {
                headers: {
                    'x-admin-secret': 'G@cor123' // Hardcoded match
                }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout title="Kelola Pengguna">
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left bg-gray-900">
                        <thead className="bg-gray-700 text-gray-200">
                            <tr>
                                <th className="p-4">Email</th>
                                <th className="p-4">Provider</th>
                                <th className="p-4">Created At</th>
                                <th className="p-4">Last Sign In</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-800/50">
                                    <td className="p-4 font-medium text-white flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        {user.email}
                                    </td>
                                    <td className="p-4 text-gray-300 capitalize">{user.app_metadata?.provider || 'Email'}</td>
                                    <td className="p-4 text-gray-400 text-sm">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-gray-400 text-sm">
                                        {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                                    </td>
                                    <td className="p-4">
                                        <button className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {users.length === 0 && !loading && (
                        <div className="p-8 text-center text-gray-500">
                            No users found.
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
