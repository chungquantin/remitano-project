import * as anchor from "@coral-xyz/anchor";
import { assert } from "chai";
import { Program } from "@coral-xyz/anchor";
import { RemitanoProject } from "../target/types/remitano_project";
import { anchorProvider, remitanoService } from "./helpers";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { TokenProgramService } from "./services/token-program.service";
import { BN } from "bn.js";
import { getTestAccount } from "./constants";
import {
  ACCOUNT_SIZE,
  getMinimumBalanceForRentExemptAccount,
} from "@solana/spl-token";
import RemitanoService from "./services/remitano.service";

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
  swapToken: true,
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
  console.log(
    "Successfully create pool ",
    poolData.poolKeypair.publicKey.toString()
  );
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
      const [poolAuthorityAddress] = await new RemitanoService(
        program
      ).findPoolLiquidityAddress(poolAddress);
      const transferTx = await TokenProgramService.createTransferTransaction(
        connection,
        anchorProvider.wallet.publicKey,
        testAccount,
        poolAuthorityAddress,
        MINT_TOKEN_ADDRESS,
        new BN(20 * LAMPORTS_PER_SOL)
      );
      const txSig = await anchorProvider.sendAndConfirm(transferTx, [
        testAccount,
      ]);
      console.log("Your transaction signature", txSig);
    });
  }

  if (tests.swapToken) {
    it("Swap token", async () => {
      /** Initialize new account for testing */
      const newAccount = Keypair.generate();
      const minimumLamport = await getMinimumBalanceForRentExemptAccount(
        connection
      );
      const createAccountTx = new Transaction();
      createAccountTx.instructions = [
        SystemProgram.createAccount({
          fromPubkey: anchorProvider.publicKey,
          newAccountPubkey: newAccount.publicKey,
          space: ACCOUNT_SIZE,
          lamports: minimumLamport,
          programId: SystemProgram.programId,
        }),
      ];

      const createAccountTxSig = await anchorProvider.sendAndConfirm(
        createAccountTx,
        [newAccount]
      );
      console.log("-- Create new account ", createAccountTxSig);
      // Create a transaction to fund test sol to newAccount
      const sol = LAMPORTS_PER_SOL * 2;
      const signature = await connection.requestAirdrop(
        newAccount.publicKey,
        sol
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
      console.log(`Airdrop ${sol} to the new account ${newAccount.publicKey}`);
      // Expected outcome: newAccount receives 1 test token, swap 1 SOL
      const { swapTokenData, transaction } = await remitanoService.swapToken(
        anchorProvider.wallet.publicKey,
        newAccount.publicKey,
        poolAddress,
        MINT_TOKEN_ADDRESS,
        new BN(LAMPORTS_PER_SOL * 1)
      );

      const swapIx = await program.methods
        .swapToken(swapTokenData.amount)
        .accounts(swapTokenData.ctx.accounts)
        .signers([newAccount])
        .instruction();

      transaction.instructions.push(swapIx);

      console.log(transaction.instructions);

      const tx = await anchorProvider.sendAndConfirm(transaction, [newAccount]);
      console.log("Your transaction signature", tx);
    });
  }
});
