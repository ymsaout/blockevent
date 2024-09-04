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
import Image from 'next/image';
import Modal from 'react-modal';
import Confetti from 'react-confetti'; // Import the Confetti component





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
    const [bidHistory, setBidHistory] = useState<any[]>([]);
    const [modalOpen, setModalOpen] = useState<boolean>(false);




    const MINT_SEED = "mint_2"
    const METADATA_SEED = "metadata";
    const TREASURY = new PublicKey("ByBtW8mRt6tgr7G134GfjWvQPPaJPKxmdHAzQCUn93ow");



    const isWalletConnected = publicKey !== null && publicKey !== undefined;

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
            symbol : "AVC",
            uri : "https://arweave.net/bYwp1HxhVR-xxU2L-AoO17wBzqATkpLZQEL4AUjE7AI",
            decimals : 0,
          }
        
        const [mint] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from(MINT_SEED)],
            program.programId
          )

        console.log("mint", mint.toString()); // Afficher la clé publique sous forme de chaîne


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
        const duration = 30 ; // 604800 seconds = one week
    
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

        console.log("bidAmount", bidAmount) // SOL
        const bidAmountInLamports = bidAmount * 1000000000;
        console.log("bidAmountInLamports", bidAmountInLamports) // Lamports

       const tx =  await program.methods
        .placeBid(new BN(bidAmountInLamports))
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

        setBidHistory((prevHistory) => [
            ...prevHistory,
            { bidder: wallet.adapter.publicKey.toBase58(), amount: bidAmountInLamports },
        ]);

        fetchAuctionInfo();

    } catch (error) {
        if (error instanceof SendTransactionError) {
            const logs = error.logs;
            if (logs) {
                const customError = logs.find(log => log.includes('Error Code:'));
                if (customError) {
                    const errorMessage = customError.split('Error Message: ')[1];
                    notify({ type: 'error', message: `Error bidding: ${errorMessage}` });
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


        const [auction, bump] = await PublicKey.findProgramAddress(
            [Buffer.from("auction"), mint.toBuffer()],
            program.programId
            
        );


        const BidderTokenAccount = await anchor.utils.token.associatedAddress({
            mint: mint,
            owner: wallet.adapter.publicKey,
          });

      
        const tx = await program.methods
        .claimNft()
        .accounts({
          auction : auction,
          highestBidderTokenAccount : BidderTokenAccount,
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
        setModalOpen(true);

    } catch (error) {
        if (error instanceof SendTransactionError) {
            const logs = error.logs;
            if (logs) {
                const customError = logs.find(log => log.includes('Error Code:'));
                if (customError) {
                    const errorMessage = customError.split('Error Message: ')[1];
                    notify({ type: 'error', message: `Error claiming NFT: ${errorMessage}` });
                } else {
                    notify({ type: 'error', message: `An unknown error occurred.` });
                }
            } else {
                notify({ type: 'error', message: `An unknown error occurred.` });
            }
        } else {
            notify({ type: 'error', message: `An unknown error occurred.` });
        }
        console.error("Error placing bid:", error);    } finally {
        setLoadingClaim(false);
    }


}





  return (
    <>
    {modalOpen && <Confetti/>}
    <div className="bg-gray-900 text-white p-6 rounded-lg mx-auto max-w-2xl">
      <Image
      src="/VC_DEDICACE.png"
      alt="solana icon"
      width={1000}
      height={1000}
      />
    {modalOpen && (
        <Modal
            isOpen={modalOpen} // Assurez-vous que la modal est contrôlée par l'état
            onRequestClose={() => setModalOpen(false)} // Fonction pour fermer la modal
            className="flex items-center justify-center h-full"
            overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" // Fond semi-transparent et centrage
        >
            <div className="bg-gray-900 rounded-lg p-6 max-w-md mx-auto">
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mb-4 animate-fade-in">Affiche remportée 🎉</h1> {/* Titre en violet */}
                <p className="text-xl text-gray-400 mb-4">Vous avez gagné l'affiche dédicacée des Vieilles Charrues, bravo ! 💪</p>
                <button
                    onClick={() => setModalOpen(false)} // Ferme la modal
                    className="group w-60 m-2 btn bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                >
                    Fermer
                </button>
            </div>
        </Modal>
    )}
      <div className="flex flex-col md:flex-row items-start">
        <div className="md:w-1/2 p-4">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mb-4 animate-fade-in">Affiche dédicacée Vieilles Charrues </h1>
          <p className="text-sm text-gray-400 mb-4">
          Laissez-vous envoûter par l'essence même de l'art et de la musique avec cette affiche dédicacée par les légendaires artistes des Vieilles Charrues tels que Justice ou PNL.          </p>
          <p className="text-sm text-gray-400 mb-4">
          Accrochez cette pièce iconique chez vous et laissez-la vous transporter vers des souvenirs inoubliables.          </p>
          <p className="text-sm text-gray-400 mb-4">
          C'est bien plus qu'une affiche, c'est une pièce de collection chargée d'émotions et de souvenirs qui illuminera votre espace de sa beauté singulière et de son aura légendaire.          </p>
          <p className="text-sm text-gray-400 mb-4">
            Il ne vous reste plus qu'à enchérir pour la récupérer!
          </p>
        </div>
        <div className="md:w-1/2 p-4 flex justify-center items-center">
          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <p className="text-sm text-gray-400 mb-4">Place une enchère pour tenter de l'emporter !</p>
            {auctionInfo && (
              <div>
                 {timeRemaining > 0 && (
                            <div className="bg-green-500 text-white p-2 rounded mb-2 text-center">
                                Enchère en cours
                            </div>
                )}
                <div className="text-lg mb-2">Temps restant : 
                    {timeRemaining > 0 ? ` ${Math.floor(timeRemaining / 60)} mn ${timeRemaining % 60} s` : <strong> Terminé</strong>} </div>
                <div className="text-lg mb-2">Enchère actuelle : {auctionInfo.highestBid/1000000000} SOL</div>
                <div className="text-lg mb-2">Gagnant actuel :   
                    <br></br>
                {auctionInfo.highestBidder.toBase58() == "11111111111111111111111111111111" ? " En attente d'une enchère" : `${auctionInfo.highestBidder.toBase58().slice(0, 6)}...${auctionInfo.highestBidder.toBase58().slice(-4)}`}                </div>
              </div>
            )}
            
            <button
              className="group w-60 m-2 btn bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black" 
              onClick={startAuction} disabled={loadingAuction|| !isWalletConnected || timeRemaining > 0}
            >
              {loadingAuction ? "En cours..." : "Démarrer la vente"}
            </button>
            <div className="flex items-center justify-center">
                <input 
                    type="number" 
                    value={bidAmount} 
                    onChange={(e) => setBidAmount(Number(e.target.value))}
                    placeholder="Montant en SOL"
                    className="border rounded p-2 mr-2" // Ajout de styles pour le champ
                    style={{ color: 'black', width: '100px' }} // Largeur fixe pour le champ
                    />
                <button 
                    onClick={setBid} 
                    disabled={loadingBid || bidAmount <= 0 || timeRemaining <= 0 || !isWalletConnected} // Désactiver si le montant est <= 0
                    className="group w-30 m-2 btn bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black" 
                >
                    {loadingBid ? "En cours..." : "Enchérir"}
                </button>
            </div>
            <button
              className="group w-60 m-2 btn bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black" 
              onClick={claimNft} disabled={loadingClaim|| !isWalletConnected || timeRemaining > 0}
            >
              {loadingClaim ? "En cours..." : "Remporter l'affiche !"}
            </button>
          </div>
        </div>
      </div>
        <div className="p-4">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mb-4 animate-fade-in">Historique des enchères</h2>
            <ul className="list-disc list-inside text-sm text-gray-400 mb-4">
                {bidHistory.slice().reverse().map((bid, index) => ( // Inverser le tableau
                    <li key={index}>
                        {bid.bidder} - {bid.amount / 1000000000} SOL
                    </li>
                ))}
            </ul>
        </div>
    </div>
    </>
  );

}

