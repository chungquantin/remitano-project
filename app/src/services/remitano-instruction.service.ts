import { TOKEN_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { PublicKey, Signer, SystemProgram } from "@solana/web3.js";
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
        poolAuthority: poolSignerAddress,
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

  static swapToken(
    amount: BN,
    senderAddress: PublicKey,
    poolAddress: PublicKey,
    poolSignerAddress: PublicKey,
    senderTokenAccount: PublicKey,
    poolTokenAccount: PublicKey,
    signers?: Signer[]
  ) {
    const ctx = {
      accounts: {
        pool: poolAddress,
        poolAuthority: poolSignerAddress,
        sender: senderAddress,
        senderTokenAccount,
        poolTokenAccount,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
      signers: signers || [],
    };

    return { amount, ctx };
  }
}
