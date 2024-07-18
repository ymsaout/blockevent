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

const CANDY_MACHINE_ID = 'GFL2Q47XzJxZedjm6Dskdhviw82c73AxPh8epcbgaZtz';
const TOKEN_ACCOUNT = '8ixLuvikkC8skxPVDbuYXoz63dFFY8wEqFDyPTnXEY6f';

export const MyNFTsView: FC = ({ }) => {
  const { wallet } = useWallet();
  const { connection } = useConnection();
  const [isNavOpen, setIsNavOpen] = useState(false);

  const [metaplex, setMetaplex] = useState(null);
  const [myNfts, setMyNfts] = useState<DasApiAsset[]>(null);
  const carouselRef = useRef(null);


  useEffect(() => {
    if (wallet && wallet.adapter) {
      const metaplexInstance = Metaplex.make(connection).use(walletAdapterIdentity(wallet.adapter));
      setMetaplex(metaplexInstance);
    }
  }, [wallet, connection])

  useEffect(() => {
    const fetchCandyMachine = async () => {
      if (!metaplex) return;
      try {
        const umi = createUmi('https://api.devnet.solana.com').use(dasApi());
        const owner = publicKey(wallet.adapter.publicKey);

        const assets: DasApiAssetList = await umi.rpc.getAssetsByOwner({
          owner,
          limit: 10
        });
        
        const filteredAssets = assets.items.filter(asset => asset.content.metadata.symbol === 'VC');
        
        setMyNfts(filteredAssets)
        console.log(filteredAssets)
      } catch (error) {
        console.error("Failed to fetch candy machine", error);
      }
    };

    fetchCandyMachine();
  }, [metaplex]);

  const truncate = (str, n) => {
    return str.length > n ? str.substring(0, n - 1) + '...' : str;
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
          <h1 className="text-center text-5xl md:pl-12 font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mb-4">
            My NFTS
          </h1>
        </div>
        {myNfts ?
          <div className="relative w-full overflow-hidden">
            <button onClick={scrollLeft} className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full">{"<"}</button>
            <div ref={carouselRef} className="flex overflow-x-scroll space-x-4 p-4">
              {myNfts.map((nft) => (
                <div key={nft.id} className="asset-card flex-shrink-0 w-1/4">
                  <div className="asset-name">NAME : {nft.content.metadata.name}</div>
                  <img src={nft.content.json_uri} width={"100px"} alt="Logo" />
                  <div className="asset-id">ID : {truncate(nft.id, 20)}</div>
                </div>
              ))}
            </div>
            <button onClick={scrollRight} className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full">{">"}</button>
          </div>
          :
          <div>
            <h2 className="text-center text-4xl md:pl-12 font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mb-4">
              You don't have NFTs on your wallet !
            </h2>
            <NavElement
              label="Mint NFTS"
              href="/"
              navigationStarts={() => setIsNavOpen(false)}
            />
          </div>
        }
      </div>
    </div>
  );
};
