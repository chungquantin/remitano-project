import { Keypair, PublicKey } from "@solana/web3.js";
import { RemitanoProject } from "../../target/types/remitano_project";
import RemitanoInstructionService from "./remitano-instruction.service";
import { Program, utils } from "@coral-xyz/anchor";

export default class RemitanoService {
  constructor(readonly program: Program<RemitanoProject>) {}
  async createLiquidityPool(payer: PublicKey, name: string) {
    const poolKeypair = Keypair.generate();
    const [poolAuthority, poolAuthorityNone] =
      await this.findPoolLiquidityAddress(poolKeypair.publicKey);

    const result = RemitanoInstructionService.initializePoolIxBase(
      name,
      payer,
      poolKeypair.publicKey,
      poolAuthority,
      poolAuthorityNone
    );

    return { poolKeypair, ...result };
  }

  async findPoolLiquidityAddress(
    poolAddress: PublicKey
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [utils.bytes.utf8.encode("POOL_LIQUIDITY"), poolAddress.toBuffer()],
      this.program.programId
    );
  }
}
