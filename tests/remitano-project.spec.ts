import * as anchor from "@coral-xyz/anchor";
import { assert } from "chai";
import { Program } from "@coral-xyz/anchor";
import { RemitanoProject } from "../target/types/remitano_project";
import { anchorProvider, remitanoService } from "./helpers";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { TokenProgramService } from "./services/token-program.service";
import { BN } from "bn.js";
import { getTestAccount } from "./constants";

// Configure the client to use the local cluster.
anchor.setProvider(anchor.AnchorProvider.env());
const program = anchor.workspace.RemitanoProject as Program<RemitanoProject>;
const connection = anchorProvider.connection;
const testAccount = getTestAccount().accountFundLiquidity;
let poolAddress: PublicKey | undefined = null;

/** UPDATE CHANGELOG
Minting 10000000 tokens
  Token: CM2Tb1iNhLsyPRaq43tFNSaQMW7N7Qx2R6ZypacCqM7S
  Recipient: FaunrPQ5VA6tbJ825QV5nLZKnzb4P9zSBUY5EU2yD7Wu

Transfer 100000 tokens
  Sender: FaunrPQ5VA6tbJ825QV5nLZKnzb4P9zSBUY5EU2yD7Wu
  Recipient: tEUZ4FqdiwQrwWcUw9B2HNEb7Dq3wuVNkU2GErZsWbd (accountFundLiquidity)
  Recipient associated token account: DJHNnDUVnUmoJBXnvLn383XsdNME1QuXC6YvRsJZypGY
  Funding recipient: DJHNnDUVnUmoJBXnvLn383XsdNME1QuXC6YvRsJZypGY
 */
const MINT_TOKEN_ADDRESS = new PublicKey(
  "CM2Tb1iNhLsyPRaq43tFNSaQMW7N7Qx2R6ZypacCqM7S"
);

const tests = {
  validateHardCodedVar: true,
  initializeLiquidityPool: true,
  fundLiquidityPool: true,
  swapToken: false,
};

export const createSamplePool = async (name: string) => {
  const poolData = await remitanoService.createLiquidityPool(
    anchorProvider.wallet.publicKey,
    name
  );

  const tx = await program.methods
    .initializePool(poolData.pool)
    .accounts(poolData.ctx.accounts)
    .signers([poolData.poolKeypair])
    .rpc();
  console.log("Your transaction signature", tx);
  return poolData;
};

describe("remitano-project", () => {
  if (tests.validateHardCodedVar) {
    it("Validate hard-coded variables", async () => {
      const testAccountAddress = testAccount.publicKey;
      const testAccountAta =
        await TokenProgramService.findAssociatedTokenAddress(
          testAccountAddress,
          MINT_TOKEN_ADDRESS
        );
      assert.equal(
        testAccountAta.toString(),
        "DJHNnDUVnUmoJBXnvLn383XsdNME1QuXC6YvRsJZypGY"
      );
    });
  }

  if (tests.initializeLiquidityPool) {
    it("Initialize liquidity pool", async () => {
      // Add your test here.
      const name = "REMITANO_SAMPLE_POOL";
      const createdPool = await createSamplePool(name);
      const fetchedPool = await program.account.basicLiquidityPool.fetch(
        createdPool.poolKeypair.publicKey
      );
      console.log("Fetched pool", fetchedPool);
      assert.deepEqual(createdPool.pool.name, fetchedPool.name);
      assert.isTrue(
        createdPool.pool.pool_provider.equals(fetchedPool.poolProvider)
      );
      poolAddress = createdPool.poolKeypair.publicKey;
    });
  }

  if (tests.fundLiquidityPool) {
    it("Fund liquidity pool", async () => {
      assert.isTrue(
        await TokenProgramService.transfer(
          connection,
          anchorProvider.wallet.publicKey,
          testAccount,
          poolAddress,
          MINT_TOKEN_ADDRESS,
          new BN(100)
        )
      );
    });
  }

  if (tests.swapToken) {
    it("Swap token", async () => {
      const newAccount = Keypair.generate();
      // Create a transaction to fund test sol to newAccount
      const signature = await connection.requestAirdrop(
        newAccount.publicKey,
        LAMPORTS_PER_SOL * 2
      );
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      // Confirm and send transaction
      await connection.confirmTransaction(
        {
          blockhash,
          lastValidBlockHeight,
          signature,
        },
        "finalized"
      );
      // Expected outcome: newAccount receives 5 test token
      const swapTokenData = await remitanoService.swapToken(
        newAccount.publicKey,
        poolAddress,
        MINT_TOKEN_ADDRESS,
        new BN(1)
      );

      const tx = await program.methods
        .swapToken(swapTokenData.amount)
        .accounts(swapTokenData.ctx.accounts)
        .signers([newAccount])
        .rpc();
      console.log("Your transaction signature", tx);
    });
  }
});
