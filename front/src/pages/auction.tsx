import type { NextPage } from "next";
import Head from "next/head";
import { AuctionView } from "../views";

const Auction: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Basics</title>
        <meta
          name="description"
          content="Auction Functionality"
        />
      </Head>
      <AuctionView />
    </div>
  );
};

export default Auction;
