const fs = require('fs');
const html = fs.readFileSync('netshort_dump.html', 'utf8');
const idx = html.indexOf('window.__NUXT__=');
if (idx !== -1) {
    // Print 500 chars from start
    console.log('--- START ---');
    console.log(html.substring(idx, idx + 500));
    console.log('--- END (Approximation) ---');
    // Find the end of script
    const end = html.indexOf('</script>', idx);
    if (end !== -1) {
        console.log(html.substring(end - 100, end));
    }
} else {
    console.log('Not found');
}
