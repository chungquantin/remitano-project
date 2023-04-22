import { PublicKey } from "@solana/web3.js";

export type BasicLiquidityPool = {
  name: String;
  created_at: number;
  signer_bump: number;
  pool_provider: PublicKey;
};
