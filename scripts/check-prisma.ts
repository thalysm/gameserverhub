import { db } from './lib/db';

async function checkModels() {
    console.log('Available models in Prisma Client:');
    const keys = Object.keys(db).filter(key => !key.startsWith('_') && !key.startsWith('$'));
    console.log(keys);
    process.exit(0);
}

checkModels().catch(console.error);
