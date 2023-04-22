import { PublicKey, SystemProgram } from "@solana/web3.js";
import BN from "bn.js";

export type ClientPoolParams = {
  name: string;
  signerBump: number;
  createdAt: BN;
  pool_provider: PublicKey;
};

export default class RemitanoInstructionService {
  static initializePoolIxBase(
    name: string,
    payerAddress: PublicKey,
    poolAddress: PublicKey,
    poolSignerAddress: PublicKey,
    poolSignerNonce: number
  ) {
    const ctx = {
      accounts: {
        payer: payerAddress,
        pool: poolAddress,
        pool_authority: poolSignerAddress,
        systemProgram: SystemProgram.programId,
      },
      signers: [],
    };
    const pool: ClientPoolParams = {
      name,
      pool_provider: payerAddress,
      createdAt: new BN(0),
      signerBump: poolSignerNonce,
    };

    return { pool, ctx };
  }
}
