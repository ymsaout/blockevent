import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Metaplex, keypairIdentity, bundlrStorage, toMetaplexFile, toBigNumber, toDateTime, sol, TransactionBuilder} from "@metaplex-foundation/js";
import { readFile } from 'fs/promises';


const REACT_APP_RPC_URL='https://api.devnet.solana.com'
const SOLANA_CONNECTION = new Connection(REACT_APP_RPC_URL, { commitment: 'finalized' });

const secret = JSON.parse(await readFile(new URL('./my-wallet.json', import.meta.url)));
const WALLET = Keypair.fromSecretKey(new Uint8Array(secret));
const NFT_METADATA = 'https://arweave.net/bPd0YFzZXiH6SgXuAqLIpV0vnPbn0PA8rJ1169nnZ8M'; 
const TREASURY = "GSSZFXo6SmU5ENTjMbxu2nZMcP24vjfo96VfiRSC1Z8w";
let COLLECTION_NFT_MINT = ''; 
let CANDY_MACHINE_ID = '';
const METAPLEX = Metaplex.make(SOLANA_CONNECTION)
    .use(keypairIdentity(WALLET));




async function createCollectionNft() {
    const { nft: collectionNft } = await METAPLEX.nfts().create({
        name: "Vieilles Charrues",
        uri: NFT_METADATA,
        sellerFeeBasisPoints: 0,
        isCollection: true,
        updateAuthority: WALLET,
      });

      COLLECTION_NFT_MINT = collectionNft.address.toString();
      console.log(`✅ - Minted Collection NFT: ${collectionNft.address.toString()}`);
      console.log(`     https://explorer.solana.com/address/${collectionNft.address.toString()}?cluster=devnet`);
}



async function generateCandyMachine() {
    const candyMachineSettings =
        {
            itemsAvailable: toBigNumber(10), // Collection Size: 10
            sellerFeeBasisPoints: 500, // 5% Royalties on Collection
            symbol: "VC",
            maxEditionSupply: toBigNumber(0), // 0 reproductions of each NFT allowed
            isMutable: true,
            creators: [
                { address: WALLET.publicKey, share: 100 },
            ],
            collection: {
                address: new PublicKey(COLLECTION_NFT_MINT), // Can replace with your own NFT or upload a new one
                updateAuthority: WALLET,
            },
        };
    const { candyMachine } = await METAPLEX.candyMachines().create(candyMachineSettings);
    CANDY_MACHINE_ID = candyMachine.address.toString();
    console.log(`✅ - Created Candy Machine: ${candyMachine.address.toString()}`);
    console.log(`     https://explorer.solana.com/address/${candyMachine.address.toString()}?cluster=devnet`);
}



async function updateCandyMachine() {
    const candyMachine = await METAPLEX
        .candyMachines()
        .findByAddress({ address: new PublicKey(CANDY_MACHINE_ID) });

    const { response } = await METAPLEX.candyMachines().update({
        candyMachine,
        guards: {
            // startDate: { date: toDateTime("2022-10-17T16:00:00Z") },
            mintLimit: {
                id: 1,
                limit: 10,
            },
            solPayment: {
                amount: sol(0.2),
                destination: new PublicKey(TREASURY), //my wallet on Phantom
            },
        }
    })
    
    console.log(`✅ - Updated Candy Machine: ${CANDY_MACHINE_ID}`);
    console.log(`     https://explorer.solana.com/tx/${response.signature}?cluster=devnet`);
}




async function addItems() {
    const candyMachine = await METAPLEX
        .candyMachines()
        .findByAddress({ address: new PublicKey(CANDY_MACHINE_ID) }); 
    const items = [];
    for (let i = 0; i < 10; i++ ) { // Add 20 NFTs (batch of 20, maximum supply 20)
        items.push({
            name: `Tickets # ${i+1}`,
            uri: NFT_METADATA
        })
    }
    const { response } = await METAPLEX.candyMachines().insertItems({
        candyMachine,
        items: items,
      },{commitment:'finalized'});

    console.log(`✅ - Items added to Candy Machine: ${CANDY_MACHINE_ID}`);
    console.log(`     https://explorer.solana.com/tx/${response.signature}?cluster=devnet`);
    return candyMachine
}



async function main() {
    console.log(`Testing Candy Machine V3...`);
    console.log(`Important account information:`)
    console.table({
        mint_creator: WALLET.publicKey.toString(),
        NFT_metadata: NFT_METADATA,
        treasury: TREASURY,
    });
    await createCollectionNft();
    await generateCandyMachine();
    await updateCandyMachine();
    const candy_machine = await addItems();


    console.table({
        collection_nft: COLLECTION_NFT_MINT,
        candy_machine: CANDY_MACHINE_ID,
        items_available: candy_machine.itemsAvailable.toNumber(),
        items_minted: candy_machine.itemsMinted.toNumber(),
        items_remaining: candy_machine.itemsRemaining.toNumber(),
    });





}

main();