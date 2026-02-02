const fs = require('fs');

function extract(filename, output) {
    console.log(`Extracting from ${filename}...`);
    const html = fs.readFileSync(filename, 'utf8');
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
    if (match) {
        try {
            const data = JSON.parse(match[1]);
            fs.writeFileSync(output, JSON.stringify(data, null, 2));
            console.log(`Success: saved to ${output}`);
            return data;
        } catch (e) { console.error(`Failed to parse JSON for ${filename}`, e); }
    } else {
        console.log(`No __NEXT_DATA__ found in ${filename}`);
    }
    return null;
}

extract('melolo-full.html', 'melolo-data.json');
extract('reelshort-full.html', 'reelshort-data.json');
