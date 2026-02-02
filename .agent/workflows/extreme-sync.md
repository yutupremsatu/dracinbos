---
description: Full Auto Elite Sync Workflow
---
// turbo-all

1. Run the Elite Sync script to gather data from all 6+ platforms including FlickReels and ShortTV.
run_command: node scripts/elite-sync-final.js

2. Perform a final verification of the database counts.
run_command: node -e "const https = require('https'); const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiY2NoenR3YmN6YWRocGt3b25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjg3NjIsImV4cCI6MjA4NTYwNDc2Mn0.5SVVDjC9Zc_1cKHGVKtt1sz3uuj6Ttf8Sz-QSx5TVls'; const url = 'https://kbcchztwbczadhpkwonm.supabase.co/rest/v1/dramas?select=count'; https.get(url, {headers: {'apikey': key, 'Authorization': 'Bearer ' + key, 'Prefer': 'count=exact'}}, (res) => { console.log('Final Total Count:', res.headers['content-range']); });"
