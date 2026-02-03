export const getApiBaseUrl = () => {
    // If running in Capacitor (localhost) or locally, use Vercel Repro
    // But if locally developing, maybe we want localhost:3000? 
    // For the APK build, we definitely want Production Vercel.
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        return 'https://dracinbos.vercel.app';
    }
    return '';
};
