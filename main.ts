import { AnchorProvider, Idl, Program, Wallet } from '@drift-labs/sdk/node_modules/@coral-xyz/anchor';
import {User, initialize, BulkAccountLoader, DriftClient, UserAccount, fetchUserAccounts, getUserAccountPublicKey} from '@drift-labs/sdk'
import * as web3 from '@solana/web3.js';
import { sendAlert } from './alert';
import { KEEPERS } from './config';
import cron from 'node-cron';

async function getUserAlert(alias: string, user: User, pubkey: web3.PublicKey): Promise<string> {
    let connection = user.driftClient.connection
    const lamportsBalance = await connection.getBalance(
		pubkey,
	);
    const solBalance = lamportsBalance / 10**9

    return `Keeper ${alias} [${pubkey.toBase58()}] \n` + 
        `* USD balance: ${user.getNetUsdValue().toNumber() / 10**6} \n` + 
        `* SOL balance: ${solBalance}\n`
}

(async() => {
    const env = 'mainnet-beta'

    const sdkConfig = initialize({env: 'mainnet-beta'})
    let connection = new web3.Connection('https://mainnet.helius-rpc.com/?api-key=74571753-6aca-4664-b162-3fbb6f5210e9')
    
    let seed = []
    for(let i = 1; i <= 32; i++) [
        seed.push(i)
    ]
    let keypairPlaceHolder = web3.Keypair.fromSeed(new Uint8Array(seed))
    let wallet = new Wallet(keypairPlaceHolder)
    let provider = new AnchorProvider(
        connection,
        wallet,
        {
			preflightCommitment: 'confirmed',
			skipPreflight: false,
			commitment: 'confirmed',
		}
    )
    const driftPublicKey = new web3.PublicKey(sdkConfig.DRIFT_PROGRAM_ID);
	const bulkAccountLoader = new BulkAccountLoader(
		provider.connection,
		'confirmed',
		5 * 60 * 1000,
	);
	const driftClient = new DriftClient({
		connection: provider.connection,
		wallet: provider.wallet,
		programID: driftPublicKey,
		accountSubscription: {
			type: 'polling',
			accountLoader: bulkAccountLoader,
		},
	});
    await driftClient.subscribe();

    let pubkeys = [], aliases = [], keeperUsers = []
    for(let i = 0; i < KEEPERS.length; ) {
        let keeperAlias = KEEPERS[i]
        let keeperPubkey = KEEPERS[i+1]
        let pubkey = new web3.PublicKey(keeperPubkey)

        pubkeys.push(pubkey)
        aliases.push(keeperAlias)

        let userPubkey = await getUserAccountPublicKey(driftClient.program.programId, pubkey, 0)
        const user = new User({
            driftClient: driftClient,
            userAccountPublicKey: userPubkey,
            accountSubscription: driftClient.userAccountSubscriptionConfig,
        });
        await user.subscribe()
        keeperUsers.push(user)
        i+=2
    }
    
    console.log('intialized all users')
    cron.schedule('*/15 * * * *', async() => {
        let msg = ''
        for(let i = 0; i < pubkeys.length; i++) {
            let m = await getUserAlert(aliases[i], keeperUsers[i], pubkeys[i])
            msg += m + '\n'
        }
        sendAlert('```' + msg + '```')
    });
})()
