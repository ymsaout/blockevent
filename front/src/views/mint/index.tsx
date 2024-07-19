/* eslint-disable react/no-unescaped-entities */
import React, { FC, useEffect, useState } from 'react';
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { Metaplex, keypairIdentity, sol, walletAdapterIdentity } from "@metaplex-foundation/js";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { notify } from 'utils/notifications';
import Image from 'next/image';
const CANDY_MACHINE_ID = 'GFL2Q47XzJxZedjm6Dskdhviw82c73AxPh8epcbgaZtz';
const AUTHORITY = "CCaZAXustnWzSegL8x3EwPQ6m39GLXo6HggB8TmTdzps";  

export const MintView: FC = ({ }) => {
  const [minting, setMinting] = useState(false);
  const [mintCount, setMintCount] = useState(1);
  const [remaining, setRemaining] = useState(0);
  const [price, setPrice] = useState(0);
  const { publicKey,wallet } = useWallet();
  const { connection } = useConnection();
  const [metaplex, setMetaplex] = useState(null);


  const isWalletConnected = publicKey !== null && publicKey !== undefined;

  useEffect(() => {
    if (wallet && wallet.adapter) {
      const metaplexInstance = Metaplex.make(connection).use(walletAdapterIdentity(wallet.adapter));
      setMetaplex(metaplexInstance);
    }
  }, [wallet, connection]);


  useEffect(() => {
    const fetchCandyMachine = async () => {
      if (!metaplex) return;
      try {
        const candyMachine = await metaplex.candyMachines().findByAddress({ address: new PublicKey(CANDY_MACHINE_ID) });
        setRemaining(candyMachine.itemsRemaining.toNumber());
        const priceInBasisPoints = candyMachine.candyGuard.guards.solPayment.amount.basisPoints.toNumber();
        setPrice(priceInBasisPoints/1000000000)
      } catch (error) {
        console.error("Failed to fetch candy machine", error);
      }
    };

    fetchCandyMachine();
  }, [metaplex,mintCount]);


  const handleMint = async () => {
    setMinting(true);
    try {
      const candyMachine = await metaplex.candyMachines().findByAddress({ address: new PublicKey(CANDY_MACHINE_ID) });
      const { nft, response } = await metaplex.candyMachines().mint({
        candyMachine,
        collectionUpdateAuthority: new PublicKey(AUTHORITY),
      },{commitment:'finalized'});
      console.log(`✅ - Minted NFT: ${nft.address.toString()}`);
      console.log(`     https://explorer.solana.com/address/${nft.address.toString()}?cluster=devnet`);
      console.log(`     https://explorer.solana.com/tx/${response.signature}?cluster=devnet`);
      notify({ type: 'success', message: `Mint Successful ! `, txid: response.signature });
      setMintCount(prevCount => prevCount + 1);

    } catch (error) {
      console.error("Minting failed", error);
      notify({ type: 'error', message: `❌ - Minting failed: ${error.message}` });
    } finally {
      setMinting(false);
    }
  };

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg mx-auto max-w-4xl">
      <Image
      src="/VC_2017_description.png"
      alt="solana icon"
      width={3500}
      height={1800}
      />        
      <div className="flex flex-col md:flex-row items-start">
        <div className="md:w-1/2 p-4">
          <h1 className="text-3xl font-bold mb-10">Les Vieilles Charrues 🎸 </h1>
          <p className="text-sm text-gray-400 mb-4">
            Le festival des Vieilles Charrues est l'un des plus grands festivals de musique en France, se déroulant chaque année à Carhaix, en Bretagne. Fondé en 1992, il attire des centaines de milliers de festivaliers venus de toute l'Europe pour profiter d'une programmation éclectique et de renommée internationale. 🎶🌍
          </p>
          <p className="text-sm text-gray-400 mb-4">
            Ce festival emblématique propose une variété de genres musicaux, allant du rock à la pop, en passant par l'électro, le hip-hop et la musique traditionnelle bretonne. Les Vieilles Charrues ont accueilli des artistes légendaires tels que Bruce Springsteen, Muse, David Bowie, et bien d'autres. 🎤
          </p>
          <p className="text-sm text-gray-400 mb-4">
            En plus des concerts, le festival offre une expérience unique avec des animations, des expositions d'art, des stands de nourriture locale et des espaces de détente. C'est un lieu de rencontre et de partage où règne une ambiance conviviale et festive. 🧘
          </p>
          <p className="text-sm text-gray-400 mb-4">
            Les Vieilles Charrues sont également engagées dans des initiatives écologiques et solidaires, mettant en avant le respect de l'environnement et le soutien aux associations locales. Chaque année, le festival continue de se réinventer tout en conservant son esprit authentique et chaleureux. 🌱
          </p>
        </div>
        <div className="md:w-1/2 p-4 flex justify-center items-center">
          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <p className="text-sm text-gray-400 mb-4">Achète ton ticket pour le festival !</p>
            <div className="text-lg mb-2">Places restantes : {remaining}</div>
            <div className="text-lg mb-2">Prix: {price} SOL</div>
            <button
              className="group w-60 m-2 btn bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"              onClick={handleMint}
              disabled={minting || !isWalletConnected}
            >
              {minting ? 'Minting...' : 'Acheter un billet'}
            </button>
            <div className="mt-4 text-sm text-gray-400">Powered by METAPLEX</div>
          </div>
        </div>
      </div>
    </div>
  );
};



