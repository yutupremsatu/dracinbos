import { collectDramaBoxData } from '../src/services/collector';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import path from 'path';

// Initialize environment variables manually since we are outside Next.js context
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function run() {
    console.log("🚀 Starting Aggregator Job...");

    const types = ['latest', 'trending', 'foryou'] as const;

    for (const type of types) {
        console.log(`\n📥 Collecting ${type}...`);
        const result = await collectDramaBoxData(type);

        if (result.success) {
            console.log(`✅ Success: ${result.count} items upserted.`);
        } else {
            console.error(`❌ Failed:`, result.error);
        }

        // Polite delay
        await new Promise(r => setTimeout(r, 2000));
    }

    console.log("\n✨ Job Complete!");
    process.exit(0);
}

run().catch(err => {
    console.error("Fatal Error:", err);
    process.exit(1);
});
