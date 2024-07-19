// Next, React
import { FC, useEffect, useState } from 'react';
import Link from 'next/link';
import NavElement from 'components/nav-element';


// Wallet
import { useWallet, useConnection } from '@solana/wallet-adapter-react';

// Components
import { RequestAirdrop } from '../../components/RequestAirdrop';
import pkg from '../../../package.json';

// Store
import useUserSOLBalanceStore from '../../stores/useUserSOLBalanceStore';

export const HomeView: FC = ({ }) => {
  const [isNavOpen, setIsNavOpen] = useState(false);


  return (
    <div className="md:hero mx-auto p-4 bg-cover bg-center">
      <div className="md:hero-content flex flex-col items-center text-center">
        <div className='mt-6'>
          <h1 className="text-5xl md:pl-12 font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mb-4 animate-fade-in">
            BlockEvent: Vos Billets à petit prix
          </h1>
        </div>
        <h4 className="md:w-full text-2xl md:text-4xl text-slate-300 my-2 animate-slide-in">
          <p>BlockEvent est une plateforme innovante qui permet de créer et vendre des billets pour des concerts et festivals de musique en utilisant la technologie blockchain pour une sécurité et une transparence optimales, le tout moins cher.</p>
        </h4>
        <div className="mt-4">
        <NavElement
                label="Regarde les concerts 😉"
                href="/mint"
                navigationStarts={() => setIsNavOpen(false)}
              />
        </div>
      </div>
    </div>
  );
};