const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kbcchztwbczadhpkwonm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiY2NoenR3YmN6YWRocGt3b25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjg3NjIsImV4cCI6MjA4NTYwNDc2Mn0.5SVVDjC9Zc_1cKHGVKtt1sz3uuj6Ttf8Sz-QSx5TVls';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runAudit() {
    console.log("--- Content Audit Report ---");

    // 1. Total
    const { count } = await supabase.from('dramas').select('*', { count: 'exact', head: true });
    console.log(`Total Dramas: ${count}`);

    const { count: missingCount, data: missingData } = await supabase
        .from('dramas')
        .select('platform', { count: 'exact' })
        .or('cover_url.is.null,cover_url.eq.""');
    console.log(`Missing Covers: ${missingCount}`);

    if (missingData) {
        const breakdown = missingData.reduce((acc, curr) => {
            acc[curr.platform] = (acc[curr.platform] || 0) + 1;
            return acc;
        }, {});
        console.log("Missing Covers Breakdown:", JSON.stringify(breakdown));
    }

    // 3. Zero Episodes
    const { count: zeroCount } = await supabase
        .from('dramas')
        .select('*', { count: 'exact', head: true })
        .eq('total_episodes', 0);
    console.log(`Zero Episodes: ${zeroCount}`);

    // 4. Stale (Older than 48h)
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const { count: staleCount } = await supabase
        .from('dramas')
        .select('*', { count: 'exact', head: true })
        .lt('updated_at', twoDaysAgo.toISOString());
    console.log(`Stale Records (>48h): ${staleCount}`);
}

runAudit();
