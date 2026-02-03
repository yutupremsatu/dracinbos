import { useState, useEffect } from 'react';

export function useAppConfig() {
    const [apkUrl, setApkUrl] = useState('/dracin_1.0.0.apk');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch('/api/admin/config');
                if (res.ok) {
                    const data = await res.json();
                    if (data.apk_url) setApkUrl(data.apk_url);
                }
            } catch (err) {
                setError(err);
                console.error('Failed to fetch app config:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchConfig();
    }, []);

    return { apkUrl, isLoading, error };
}
