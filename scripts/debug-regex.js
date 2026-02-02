const fs = require('fs');

function analyze(filename) {
    console.log(`--- Analyzing ${filename} ---`);
    const html = fs.readFileSync(filename, 'utf8');

    // Look for IDs and Titles in a broad way
    // Pattern: [0-9]{5,} (IDs are usually 5+ digits)
    // Pattern: "title":"..."

    const ids = html.match(/"id":"(\d+)"/g) || [];
    const bookIds = html.match(/"book_id":"(\d+)"/g) || [];
    const titles = html.match(/"title":"(.*?)"/g) || [];
    const bookNames = html.match(/"book_name":"(.*?)"/g) || [];

    console.log(`IDs count: ${ids.length}`);
    console.log(`bookIds count: ${bookIds.length}`);
    console.log(`Titles count: ${titles.length}`);
    console.log(`bookNames count: ${bookNames.length}`);

    if (ids.length) console.log("Sample ID:", ids[0]);
    if (titles.length) console.log("Sample Title:", titles[0]);

    // Check for Next.js push pattern
    const pushes = html.match(/self\.__next_f\.push\(\[1,"(.*?)"\]\)/g) || [];
    console.log(`Next.js push chunks: ${pushes.length}`);
}

analyze('melolo-full.html');
analyze('reelshort-full.html');
