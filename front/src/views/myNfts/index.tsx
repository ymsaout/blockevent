/* eslint-disable react/no-unescaped-entities */
// Next, React
import { FC, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Metaplex, PublicKey, keypairIdentity, walletAdapterIdentity } from "@metaplex-foundation/js";
import { publicKey } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { DasApiAssetList, dasApi, DasApiAsset } from '@metaplex-foundation/digital-asset-standard-api';

// Wallet
import { useWallet, useConnection } from '@solana/wallet-adapter-react';

// Store
import NavElement from 'components/nav-element';

const COLLECTION_NFT_MINT = '7gQ7jvBRgAYoYywCSyd8Vp1oufTbu9amvEVZc1Aph7XW';

export const MyNFTsView: FC = ({ }) => {
  const { wallet} = useWallet();
  const { connection } = useConnection();
  const [isNavOpen, setIsNavOpen] = useState(false);

  const [metaplex, setMetaplex] = useState(null);
  const [myNfts, setMyNfts] = useState<DasApiAsset[]>(null);
  const [nftImage, setNftImage] = useState<string>(null);
  const carouselRef = useRef(null);


  useEffect(() => {
    if (wallet && wallet.adapter) {
      const metaplexInstance = Metaplex.make(connection).use(walletAdapterIdentity(wallet.adapter));
      setMetaplex(metaplexInstance);
      console.log("Metaplex")
    }
  }, [wallet, connection,wallet?.adapter?.publicKey])


  const fetchJsonContent = async (uri) => {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error('Failed to fetch JSON content');
    }
    return await response.json();
  };

  const fetchCandyMachine = async () => {
    if (!metaplex || !wallet || !wallet.adapter || !wallet.adapter.publicKey) return;
    try {
      const umi = createUmi('https://api.devnet.solana.com').use(dasApi());
      const owner = publicKey(wallet.adapter.publicKey);

      const assets: DasApiAssetList = await umi.rpc.getAssetsByOwner({
        owner,
        limit: 10
      });
      
      const filteredAssets = assets.items.filter(asset => asset.grouping[0].group_value === COLLECTION_NFT_MINT);
      
      setMyNfts(filteredAssets)
      console.log("Fetch NFT")
      const jsonContent = await fetchJsonContent(filteredAssets[0].content.json_uri);
      setNftImage(jsonContent.image)
    } catch (error) {
      console.error("Failed to fetch candy machine", error);
    }
  };

  useEffect(() => {
    fetchCandyMachine();
  }, [metaplex,wallet,connection,wallet?.adapter?.publicKey]);




  const truncate = (str, n) => {
    if (str.length <= n) return str;
    const partLength = Math.floor((n - 3) / 2); // -3 pour les "..."
    return str.substring(0, partLength) + '...' + str.substring(str.length - partLength);
  };

  const scrollLeft = () => {
    carouselRef.current.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = () => {
    carouselRef.current.scrollBy({ left: 300, behavior: 'smooth' });
  };


  return (
    <div className="md:hero mx-auto p-4">
      <div className="md:hero-content flex flex-col">
        <div className='mt-6'>
          <h1 className="text-center text-5xl md:pl-12 font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mb-2">
            Mes places de concert
          </h1>
        </div>
        {!wallet || !wallet.adapter ?
          <div>
            <h2 className="text-center text-3xl md:pl-12 font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mb-10">
              Votre wallet n'est pas connecté 
            </h2>
            <p className="text-center md:pl-12 text-white-800 text-xl">Regarde en haut à droite 😉 </p>
          </div>
          :
          myNfts && myNfts.length  ?
            <div className="relative w-full overflow-hidden">
              <button onClick={scrollLeft} className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full">{"<"}</button>
              <div ref={carouselRef} className="flex overflow-x-scroll space-x-4 p-4">
                {myNfts.map((nft) => (
                  <div key={nft.id} className="asset-card flex-shrink-0 w-1/4" style={{ backgroundColor: '#1a202c' }}>
                    <div className="asset-name">NOM : {nft.content.metadata.name}</div>
                    <img src={nftImage} width={"100px"} alt="Logo" />
                    <div className="asset-id">ID : {truncate(nft.id, 20)}</div>
                  </div>
                ))}
              </div>
              <button onClick={scrollRight} className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full">{">"}</button>
            </div>
            :
            <div>
              <h2 className="text-center text-4xl md:pl-12 font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mb-10">
                Tu ne possèdes aucune place pour le moment !
              </h2>
              <NavElement
                label="Regarde les concerts 😉"
                href="/mint"
                navigationStarts={() => setIsNavOpen(false)}
              />
            </div>
          }
        </div>
      </div>
  );
};
