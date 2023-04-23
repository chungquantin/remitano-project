import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { RemitanoProject } from "../../target/types/remitano_project";
import RemitanoInstructionService from "./remitano-instruction.service";
import { BN, Program, utils } from "@coral-xyz/anchor";
import { TokenProgramService } from "./token-program.service";
import { TokenProgramInstructionService } from "./token-program-instruction.service";

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
    senderAddress: PublicKey,
    poolAddress: PublicKey,
    tokenMintAddress: PublicKey,
    amount: BN
  ) {
    const transaction: Transaction = new Transaction();
    const [poolAuthorityAddress, _] = await this.findPoolLiquidityAddress(poolAddress);
    // Find token account of pool
    const [poolAuthorityTokenAddress, createPoolAuthorityTokenAccountIxs] =
      await TokenProgramService.createAssociatedTokenAccountIfNotExist(
        this.connection,
        payer,
        poolAuthorityAddress,
        tokenMintAddress
      );
    // Find token account of user wallet
    const [senderTokenAddress, createSenderTokenAccountIxs] =
      await TokenProgramService.createAssociatedTokenAccountIfNotExist(
        this.connection,
        payer,
        senderAddress,
        tokenMintAddress
      );
    const result = await RemitanoInstructionService.swapToken(
      amount,
      senderAddress,
      poolAddress,
      poolAuthorityAddress,
      senderTokenAddress,
      poolAuthorityTokenAddress,
      []
    );

    const nativeTransferIx =
      await TokenProgramInstructionService.createNativeTokenTransferIx(
        senderAddress,
        poolAuthorityAddress,
        amount.toNumber()
      );
    transaction.instructions = [
      ...createPoolAuthorityTokenAccountIxs,
      ...createSenderTokenAccountIxs,
      nativeTransferIx,
    ];
    console.log("-- Create token account address transaction");
    return { transaction, swapTokenData: result };
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
