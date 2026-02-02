const fs = require('fs');
const json = JSON.parse(fs.readFileSync('reelshort_next_data.json', 'utf8'));

const findArrays = (obj, path = '') => {
    if (!obj || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
        if (obj.length > 0) {
            const sample = obj[0];
            // Check for drama-like properties
            if (sample && (sample.bookId || sample.title || sample.book_name || sample.bookName)) {
                console.log(`PATH: ${path} | LEN: ${obj.length} | ID: ${sample.bookId || sample.id} | TITLE: ${sample.title || sample.bookName}`);
            }
        }
    } else {
        for (const k in obj) {
            if (path.split('.').length < 10) { // limit depth
                findArrays(obj[k], path ? `${path}.${k}` : k);
            }
        }
    }
}

findArrays(json);
