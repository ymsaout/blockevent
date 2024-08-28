import { FC, useCallback, useState } from 'react';
import { BN, Idl, Program } from "@coral-xyz/anchor";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { getProvider,Provider, web3 } from '@project-serum/anchor';
import IDL from '../../../../back/target/idl/token_minter.json'; // Assurez-vous d'avoir le fichier IDL de votre programme
import { notify } from 'utils/notifications';



const InitTokenButton: FC = () => {
    const programID = new PublicKey("5wrfmBvkFaayrm8XYgXTvway4Rxt6ZBedt7sB4Z36A9c");
    const { connection } = useConnection();
    const { publicKey} = useWallet();
    const [loading, setLoading] = useState(false);


  const initToken = async () => {
    if (!publicKey) {
        notify({ type: 'error', message: `Wallet not connected!` });
        console.log('error', `Send Transaction: Wallet not connected!`);
        return;
    }

    setLoading(true);
    try {
        const program = new Program<Idl>(IDL as Idl, programID, {
            connection,
        });

      const metadata = {
        name: "TokenName",
        symbol: "SYM",
        uri: "https://example.com",
        decimals: 0,
      };

      const mint = Keypair.generate();
      const metadataAddress = Keypair.generate();

      await program.methods.initToken(metadata)
        .accounts({
          metadata: metadataAddress.publicKey,
          mint: mint.publicKey,
          payer: provider.wallet.publicKey,
          rent: web3.SYSVAR_RENT_PUBKEY,
          systemProgram: SystemProgram.programId,
          tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
          tokenMetadataProgram: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
        })
        .signers([mint, metadataAddress, provider.wallet.payer])
        .rpc();

      console.log("Token initialized");
    } catch (error) {
      console.error("Error initializing token:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={initToken} disabled={loading}>
        {loading ? "Initializing..." : "Initialize Token"}
      </button>
    </div>
  );
};

export default InitTokenButton;