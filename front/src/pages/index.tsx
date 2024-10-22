import type { NextPage } from "next";
import Head from "next/head";
import { HomeView } from "../views";
import { useState } from "react";

const Home: NextPage = (props) => {

  const [mintCount, setMintCount] = useState(0);


  return (
    <div>
      <Head>
        <title>Solana Scaffold</title>
        <meta
          name="description"
          content="Solana Scaffold"
        />
      </Head>
      <HomeView/>
    </div>
  );
};

export default Home;
