import { PublicKey } from '@solana/web3.js';

export type BasicLiquidityPool = {
    name: String;
    createdAt: number;
    signerBump: number;
    poolProvider: PublicKey;
};
