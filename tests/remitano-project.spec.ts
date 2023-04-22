import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { RemitanoProject } from "../target/types/remitano_project";
import { anchorProvider, program, remitanoService } from "./helpers";

export const createSamplePool = async (name: string) => {
  const poolData = await remitanoService.createLiquidityPool(
    anchorProvider.wallet.publicKey,
    name
  );

  await program.methods
    .initializePool(poolData.pool)
    .accounts(poolData.ctx.accounts)
    .signers([poolData.poolKeypair])
    .rpc();

  return poolData;
};

describe("remitano-project", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.RemitanoProject as Program<RemitanoProject>;

  it("Is liquidity pool initialized!", async () => {
    // Add your test here.
    const name = "REMITANO_SAMPLE_POOL";
    const { pool, ctx } = await createSamplePool(name);
    const tx = await program.methods.initializePool(pool).rpc();
    console.log("Your transaction signature", tx);
  });
});
