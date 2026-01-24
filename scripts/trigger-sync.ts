import { syncProxy } from '../lib/proxy';

async function run() {
    console.log("Triggering proxy sync...");
    await syncProxy();
    console.log("Done.");
}

run().catch(console.error);
