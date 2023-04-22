import {
  Connection,
  Keypair,
  PublicKey,
  Signer,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { RemitanoProject } from "../../target/types/remitano_project";
import RemitanoInstructionService from "./remitano-instruction.service";
import { BN, Program, utils } from "@coral-xyz/anchor";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { TokenProgramService } from "./token-program.service";

export default class RemitanoService {
  private connection: Connection;

  constructor(readonly program: Program<RemitanoProject>) {
    this.connection = program.provider.connection;
  }
  async createLiquidityPool(payer: PublicKey, name: string) {
    const poolKeypair = Keypair.generate();
    const [poolAuthority, poolAuthorityNone] =
      await this.findPoolLiquidityAddress(poolKeypair.publicKey);
    console.log("-- Pool authority: ", poolAuthority.toString());
    const result = RemitanoInstructionService.initializePoolIxBase(
      name,
      payer,
      poolKeypair.publicKey,
      poolAuthority,
      poolAuthorityNone
    );
    console.log("-- Payload: ", JSON.stringify(result, null, 4));
    return { poolKeypair, ...result };
  }

  /**
   * Swap token implementaiton
   * @param payer Address of swapper wallet
   * @param pool Address of the liquidity pool
   * @param amount Number of natvie SOL swapped
   */
  async swapToken(
    payer: PublicKey,
    poolAddress: PublicKey,
    tokenMintAddress: PublicKey,
    amount: BN
  ) {
    const [poolAuthority, _] = await this.findPoolLiquidityAddress(poolAddress);
    // Find token account of pool
    const [poolTokenAddress, createPoolTokenAccountIxs] =
      await TokenProgramService.findRecipientTokenAddress(
        this.connection,
        payer,
        poolAddress,
        tokenMintAddress
      );
    // Find token account of user wallet
    const [swapperTokenAddress, createSwapperTokenAccountIxs] =
      await TokenProgramService.findRecipientTokenAddress(
        this.connection,
        payer,
        poolAddress,
        tokenMintAddress
      );
    const result = await RemitanoInstructionService.swapToken(
      amount,
      payer,
      poolAddress,
      poolAuthority,
      poolTokenAddress,
      swapperTokenAddress
    );

    const instructions: TransactionInstruction[] = [];
    if (createPoolTokenAccountIxs) instructions.push(createPoolTokenAccountIxs);
    if (createSwapperTokenAccountIxs)
      instructions.push(createSwapperTokenAccountIxs);
    const { blockhash } = await this.connection.getLatestBlockhash();
    const transactionMessage = new TransactionMessage({
      payerKey: payer,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message();

    const transaction = new VersionedTransaction(transactionMessage);
    const tx = await this.connection.sendTransaction(transaction);
    console.log("-- Create token account address transaction", tx);

    return { ...result };
  }

  async findPoolLiquidityAddress(
    poolAddress: PublicKey
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [utils.bytes.utf8.encode("POOL_LIQUIDITY"), poolAddress.toBuffer()],
      this.program.programId
    );
  }
}
