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

  const mintToken = async () => {

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

        const [mint] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from(MINT_SEED)],
            program.programId
          )

        const mintAmount = 1;
    
        const destination = await anchor.utils.token.associatedAddress({
            mint: mint,
            owner: wallet.adapter.publicKey
          });
      
          let initialBalance: number;
      
          try {
            const balance = (await connection.connection.getTokenAccountBalance(destination))
            initialBalance = balance.value.uiAmount;
          } catch {
            // Token account not yet initiated has 0 balance
            initialBalance = 0;
          } 
          
            const context = {
                mint,
                destination,
                payer: wallet.adapter.publicKey,
                rent: web3.SYSVAR_RENT_PUBKEY,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
            };
      
            const tx = await program.methods
                .mintTokens(new BN(mintAmount))
                .accounts(context)
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
      
      


            const balance = (await connection.connection.getTokenAccountBalance(destination))
            const postBalance = balance.value.uiAmount;
            console.log("postBalance", postBalance)
            console.log("txHash", txHash)

        } catch (error) {
            console.error("Error minting token:", error);
        } finally {
            setLoading(false);
        }
  };

  const startAuction = async () => {

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

        const [mint] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from(MINT_SEED)],
            program.programId
        )
        const [auction, bump] = await PublicKey.findProgramAddress(
            [Buffer.from("auction"), mint.toBuffer()],
            program.programId
        );
        const duration = 604800 ; // 604800 seconds = one week
    
        const tx = await program.methods
            .startAuction(new anchor.BN(duration))
            .accounts({
            auction: auction,
            mint: mint,
            payer: wallet.adapter.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
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
    
        const auctionAccount = await program.account.auction.fetch(auction)
        console.log("auctionAccount", auctionAccount)
        console.log("auctionAccount.tokenMint", auctionAccount.tokenMint)
        console.log("auctionAccount.highestBid", auctionAccount.highestBid)
        console.log("auctionAccount.highestBidder", auctionAccount.highestBidder)
        
    } catch (error) {
        console.error("Error starting auction:", error);
    } finally {
        setLoading(false);
    }





  }





  return (
    <div>
      <button onClick={initToken} disabled={loading}>
        {loading ? "Initializing..." : "Initialize Token"}
      </button>
      <br/>
      <button onClick={mintToken} disabled={loading}>
        {loading ? "Minting..." : "Mint Token"}
      </button>
      <br/>
      <button onClick={startAuction} disabled={loading}>
        {loading ? "Starting Auction..." : "Start Auction"}
      </button>

    </div>
  );
};
