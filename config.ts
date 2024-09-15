import * as dotenv from 'dotenv';
dotenv.config()

export const WEBHOOK = process.env.DISCORD_WEBHOOK || '';
const KEEPERS_RAW = process.env.KEEPERS || '' // alias,pubkey,alias2,pubkey2
export const KEEPERS = KEEPERS_RAW.split(',')
export const HTTP_TIMEOUT = { timeout: 20000 }
