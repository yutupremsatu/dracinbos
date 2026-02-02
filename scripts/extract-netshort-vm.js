const fs = require('fs');
const vm = require('vm');

const run = () => {
    try {
        const html = fs.readFileSync('netshort_dump.html', 'utf8');
        const startTag = 'window.__NUXT__=';
        const idx = html.indexOf(startTag);

        if (idx === -1) {
            console.log('No NUXT data start tag found.');
            return;
        }

        let sub = html.substring(idx);
        const endIdx = sub.indexOf('</script>');
        if (endIdx !== -1) sub = sub.substring(0, endIdx);

        // Execute directly without renaming
        const safeCode = sub;

        console.log('Safe Code Start:', safeCode.substring(0, 200));

        const sandbox = {
            window: {},
            console: console,
            document: {},
            location: { href: 'https://www.netshort.com/' },
            navigator: { userAgent: 'Node' }
        };
        sandbox.window = sandbox; // Self-ref

        vm.createContext(sandbox);
        vm.runInContext(safeCode, sandbox);
        const data = sandbox.window.__NUXT__;

        console.log('VM Executed. dumping root keys...');
        console.log('Root keys:', Object.keys(data));

        if (data.state) {
            console.log('State found!');
            console.log('State keys:', Object.keys(data.state));

            // Heuristic recursive search for arrays
            const scan = (obj, path = '', depth = 0) => {
                if (depth > 4) return;
                for (const k in obj) {
                    const val = obj[k];
                    if (Array.isArray(val)) {
                        if (val.length > 0) {
                            console.log(`Found Array at ${path}.${k} (Len: ${val.length})`);
                            if (val[0] && typeof val[0] === 'object') {
                                console.log(`  Sample keys: ${Object.keys(val[0]).join(', ')}`);
                            }
                        }
                    } else if (val && typeof val === 'object') {
                        scan(val, `${path}.${k}`, depth + 1);
                    }
                }
            };
            scan(data.state, 'state');
        } else {
            console.log('No state object in root.');
        }

    } catch (e) {
        console.log('Error:', e.message);
    }
};

run();
