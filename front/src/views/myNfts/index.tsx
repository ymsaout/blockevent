// Next, React
import { FC, useEffect, useState } from 'react';
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

  useEffect(() => {
    if (wallet.adapter) {
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

        setMyNfts(assets.items)
        console.log(assets.items);
      } catch (error) {
        console.error("Failed to fetch candy machine", error);
      }
    };

    fetchCandyMachine();
  }, [metaplex]);

  const truncate = (str, n) => {
    return str.length > n ? str.substring(0, n - 1) + '...' : str;
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
          <div className="assets-list">
            {myNfts && myNfts.map((nft) => (
              <div key={nft.id} className="asset-card">
                <div className="asset-name">NAME : {nft.content.metadata.name}</div>
                {/* URI : {nft.content.json_uri} */}
                {/* <image src="nft.content.json_uri"></image> */}
                <img src={nft.content.json_uri} width={"100px"} alt="Logo" />
                <div className="asset-id">ID : {truncate(nft.id, 20)}</div>
                {/* <button className="buy-button">BUY</button> */}
              </div>
            ))}
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
