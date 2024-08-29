import { FC, useCallback, useEffect, useState } from 'react';
import { BN, Idl, Program,AnchorProvider,Provider } from "@coral-xyz/anchor";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, clusterApiUrl, SystemProgram, TransactionMessage, VersionedTransaction, SendTransactionError} from '@solana/web3.js';
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
    const [loadingInit, setLoadingInit] = useState(false);
    const [loadingMint, setLoadingMint] = useState(false);
    const [loadingAuction, setLoadingAuction] = useState(false);
    const [loadingBid, setLoadingBid] = useState(false);
    const [loadingClaim, setLoadingClaim] = useState(false);
    const [auctionInfo, setAuctionInfo] = useState<any>(null);
    const [bidAmount, setBidAmount] = useState<number>(0);
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);


    const MINT_SEED = "mint"
    const METADATA_SEED = "metadata";
    const TREASURY = new PublicKey("ByBtW8mRt6tgr7G134GfjWvQPPaJPKxmdHAzQCUn93ow");




    const getRecentBlockhash = async (): Promise<string | null> => {
        try {
          return (await connection.connection.getLatestBlockhash()).blockhash;
        } catch (error) {
          console.error(error);
          return null;
        }
      }

    // Function to fetch auction info
    const fetchAuctionInfo = async () => {
        try {
            setLoadingAuction(true);
            const program = new Program<Idl>(IDL as Idl, programID, {
                connection: connection.connection,
            });
            const [mint] = anchor.web3.PublicKey.findProgramAddressSync(
                [Buffer.from(MINT_SEED)],
                program.programId
            );
            const [auction, bump] = await PublicKey.findProgramAddress(
                [Buffer.from("auction"), mint.toBuffer()],
                program.programId
            );
            const auctionAccount = await program.account.auction.fetch(auction);
            console.log("auctionAccount", auctionAccount);
            console.log("auctionAccount.tokenMint", auctionAccount.tokenMint);
            console.log("auctionAccount.highestBid", auctionAccount.highestBid);
            console.log("auctionAccount.highestBidder", auctionAccount.highestBidder);

            // Update state with auction info
            setAuctionInfo(auctionAccount);
            const currentTime = Math.floor(Date.now() / 1000);
            const endTime = Number(auctionAccount.endTime);
            setTimeRemaining(endTime - currentTime);
        } catch (error) {
            console.error("Error fetching auction info:", error);
        } finally {
            setLoadingAuction(false);
        }
    };

    useEffect(() => {
        // Fetch auction info initially
        fetchAuctionInfo();

        // Set up interval to fetch auction info periodically
        // const interval = setInterval(fetchAuctionInfo, 5000); // Fetch every 5 seconds

        // return () => clearInterval(interval); // Clean up interval on component unmount
    }, []);

    useEffect(() => {
        if (timeRemaining !== null) {
            const interval = setInterval(() => {
                setTimeRemaining((prevTime) => {
                    if (prevTime && prevTime > 0) {
                        return prevTime - 1;
                    } else {
                        clearInterval(interval);
                        return 0;
                    }
                });
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [timeRemaining]);








  const initToken = async () => {
    if (!publicKey) {
        notify({ type: 'error', message: `Wallet not connected!` });
        console.log('error', `Send Transaction: Wallet not connected!`);
        return;
    }

    setLoadingInit(true);
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
      setLoadingInit(false);
    }
  };

  const mintToken = async () => {

    if (!publicKey) {
        notify({ type: 'error', message: `Wallet not connected!` });
        console.log('error', `Send Transaction: Wallet not connected!`);
        return;
    }

    setLoadingMint(true);

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
            setLoadingMint(false);
        }
  };

  const startAuction = async () => {

    if (!publicKey) {
        notify({ type: 'error', message: `Wallet not connected!` });
        console.log('error', `Send Transaction: Wallet not connected!`);
        return;
    }

    setLoadingAuction(true);

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
        fetchAuctionInfo();
    
    } catch (error) {
        console.error("Error starting auction:", error);
    } finally {
        setLoadingAuction(false);
    }

};





const setBid = async () => {

    if (!publicKey) {
        notify({ type: 'error', message: `Wallet not connected!` });
        console.log('error', `Send Transaction: Wallet not connected!`);
        return;
    }

    setLoadingBid(true);

    try {

        const program = new Program<Idl>(IDL as Idl, programID, {
            connection: connection.connection,
        });

        const [mint] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from(MINT_SEED)],
            program.programId
        );

        const [auction, bump] = await PublicKey.findProgramAddress(
            [Buffer.from("auction"), mint.toBuffer()],
            program.programId
        );

       const tx =  await program.methods
        .placeBid(new BN(bidAmount))
        .accounts({
          auction : auction,
          bidder : wallet.adapter.publicKey,
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

        fetchAuctionInfo();

    } catch (error) {
        if (error instanceof SendTransactionError) {
            const logs = error.logs;
            if (logs) {
                const customError = logs.find(log => log.includes('Error Code:'));
                if (customError) {
                    notify({ type: 'error', message: `Error bidding: ${customError}` });
                } else {
                    notify({ type: 'error', message: `An unknown error occurred.` });
                }
            } else {
                notify({ type: 'error', message: `An unknown error occurred.` });
            }
        } else {
            notify({ type: 'error', message: `An unknown error occurred.` });
        }
        console.error("Error placing bid:", error);
    } finally {
        setLoadingBid(false);
    }

}


const claimNft = async () => {

    if (!publicKey) {
        notify({ type: 'error', message: `Wallet not connected!` });
        console.log('error', `Send Transaction: Wallet not connected!`);
        return;
    }

    setLoadingClaim(true);

    try {

        const program = new Program<Idl>(IDL as Idl, programID, {
            connection: connection.connection,
        });

        const [mint] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from(MINT_SEED)],
            program.programId
        );

        console.log("mint", mint.toBase58())

        const [auction, bump] = await PublicKey.findProgramAddress(
            [Buffer.from("auction"), mint.toBuffer()],
            program.programId
        );

        console.log("auction", auction.toBase58())

        const auctionAccount = await program.account.auction.fetch(auction) as {
            highestBidder: PublicKey;
        };

        console.log("Highest Bidder", auctionAccount.highestBidder.toBase58())


        const tx = await program.methods
        .claimNft()
        .accounts({
          auction : auction,
          highestBidderTokenAccount : auctionAccount.highestBidder,
          claimant : wallet.adapter.publicKey,
          treasury : TREASURY,
          mint : mint,
          tokenProgram : TOKEN_PROGRAM_ID,
          systemProgram : anchor.web3.SystemProgram.programId,
          associatedTokenProgram : anchor.utils.token.ASSOCIATED_PROGRAM_ID,
      
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

    } catch (error) {
        console.error("Error claiming NFT:", error);
    } finally {
        setLoadingClaim(false);
    }


}





  return (
    <div>
      <button onClick={initToken} disabled={loadingInit}>
        {loadingInit ? "Initializing..." : "Initialize Token"}
      </button>
      <br/>
      <button onClick={mintToken} disabled={loadingMint}>
        {loadingMint ? "Minting..." : "Mint Token"}
      </button>
      <br/>
      <button onClick={startAuction} disabled={loadingAuction}>
        {loadingAuction ? "Starting Auction..." : "Start Auction"}
      </button>
      <br/>
        <button onClick={setBid} disabled={loadingBid}>
        {loadingBid ? "Bidding..." : "Bid"}
      </button>
      <input 
      type="number" 
      value={bidAmount} 
      onChange={(e) => setBidAmount(Number(e.target.value))}
      style={{ color: 'black' }}
      />
      <br/>
      <br/>
      {auctionInfo && (
        <div>
            <p> <strong>Auction Info</strong></p>
            <p>Token Mint: {auctionInfo.tokenMint.toBase58()}</p>
            <p>Highest Bid: {auctionInfo.highestBid.toString()}</p>
            <p>Highest Bidder: {auctionInfo.highestBidder.toBase58()}</p>
            <p>Time Remaining: {timeRemaining} seconds</p>
        </div>
      )}
      <br/>
      <br/>
      <button onClick={claimNft} disabled={loadingClaim}>
        {loadingClaim ? "Claiming..." : "Claim NFT"}
      </button>

    </div>
  );

}

