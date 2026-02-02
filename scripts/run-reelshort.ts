
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { collectReelShortData } from '../src/services/collector';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function run() {
    console.log("🚀 Starting Manual ReelShort Collection...");
    const result = await collectReelShortData();
    if (result.success) {
        console.log(`✅ Success! Collected ${result.count} dramas.`);
    } else {
        console.error(`❌ Failed:`, result.error);
    }
}

run();
