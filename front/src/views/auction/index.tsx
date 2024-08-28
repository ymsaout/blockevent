import { FC, useCallback, useState } from 'react';
import { BN, Idl, Program,AnchorProvider,Provider } from "@coral-xyz/anchor";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, clusterApiUrl, SystemProgram, TransactionMessage, VersionedTransaction} from '@solana/web3.js';
import { getProvider, web3 } from '@project-serum/anchor';
import IDL from '../../../../back/target/idl/token_minter.json'; // Assurez-vous d'avoir le fichier IDL de votre programme
import { notify } from 'utils/notifications';
import * as anchor from "@coral-xyz/anchor";
import { 
    TOKEN_PROGRAM_ID,
  } from "@solana/spl-token";




export const AuctionView: FC = () => {
    const programID = new PublicKey("5wrfmBvkFaayrm8XYgXTvway4Rxt6ZBedt7sB4Z36A9c");
    const connection = useConnection();
    const { publicKey,wallet,sendTransaction, signTransaction} = useWallet();
    const [loading, setLoading] = useState(false);
    const MINT_SEED = "mint"
    const METADATA_SEED = "metadata";

    const getRecentBlockhash = async (): Promise<string | null> => {
        try {
          return (await connection.connection.getLatestBlockhash()).blockhash;
        } catch (error) {
          console.error(error);
          return null;
        }
      }







  const initToken = async () => {
    if (!publicKey) {
        notify({ type: 'error', message: `Wallet not connected!` });
        console.log('error', `Send Transaction: Wallet not connected!`);
        return;
    }

    setLoading(true);
    try {
        const program = new Program<Idl>(IDL as Idl, programID, {
            connection: connection.connection,
        });


        const metadata = {
            name : "Vieilles Charrues_SPL",
            symbol : "VC",
            uri : "https://arweave.net/bPd0YFzZXiH6SgXuAqLIpV0vnPbn0PA8rJ1169nnZ8M",
            decimals : 0,
          }

        const [mint] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from(MINT_SEED)],
            program.programId
          )

        const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

        const [metadataAddress] = anchor.web3.PublicKey.findProgramAddressSync(
            [
            Buffer.from(METADATA_SEED),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            mint.toBuffer(),
            ],
            TOKEN_METADATA_PROGRAM_ID
        );

        const tx = await program.methods.initToken(metadata)
            .accounts({
            metadata: metadataAddress,
            mint: mint,
            payer: wallet.adapter.publicKey,
            rent: web3.SYSVAR_RENT_PUBKEY,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
            })
            .transaction();
        
        const latestBlockhash = await getRecentBlockhash();

        tx.recentBlockhash = latestBlockhash;
        tx.feePayer = wallet.adapter.publicKey;

        const message = new TransactionMessage({
            payerKey: publicKey!,
            recentBlockhash: latestBlockhash!,
            instructions: tx.instructions,
        }).compileToV0Message();
        

        const versionedTx = new VersionedTransaction(message);
        const signedTransaction = await signTransaction(versionedTx)
        const txHash = await connection.connection.sendTransaction(signedTransaction);
        await connection.connection.confirmTransaction(txHash, 'finalized');
        console.log("txHash", txHash)

      console.log("Token initialized");
    } catch (error) {
      console.error("Error initializing token:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={initToken} disabled={loading}>
        {loading ? "Initializing..." : "Initialize Token"}
      </button>
      
    </div>
  );
};

