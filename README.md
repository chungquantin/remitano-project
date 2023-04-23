# Remitano Project

## Project Description

Please create a smart contract that allows users to swap tokens.
Once you have completed the application, please deploy it to Solana testnet, upload the source code to GitHub (or your favorite git hosting provider) and submit the links to:

### Link to submission

https://remi.group/project-blockchain-submission

### Required Features:
The implementation steps are covered in the below section
- [x] Create a new token on Solana testnet, for example, MOVE token.
- [x] Create a smart contract to swap SOL to MOVE token, for each SOL swapped we will receive 10 MOVE (the price is a constant).
- [x] Create a UI to swap or create a script to execute to send swap transaction to Solana testnet

### Technical requirements:

- [x] Use Git and commit often
- [x] Have unit test for that contract
- [x] Smart contract have to be deployed to Solana testnet and execute successfully

## Submission Checklist

- [x] Create a new token on Solana testnet, for example, MOVE token.
* Address of new token: `CM2Tb1iNhLsyPRaq43tFNSaQMW7N7Qx2R6ZypacCqM7S`
* Mint authority: `BxUeMg5etjmiDX25gbGi2pn1MyzkcQx3ZCCiUifTUhyj`
* Supply: `10,030,000,000` (decimals: 9)

- [x] Have unit test for that contract

Link to test folder: https://github.com/chungquantin/remitano-project/blob/master/tests/remitano-project.spec.ts

To run the test: `npm run test` or `anchor test` in the root directory

- [x] Create a UI to swap or create a script to execute to send swap transaction to Solana testnet
* Deployed URL: https://remitano-project.netlify.app/
<img width="1440" alt="Screen Shot 2023-04-23 at 07 48 22" src="https://user-images.githubusercontent.com/56880684/233837922-cbda186c-0d4f-4ab0-a15a-c2acc2fbf3df.png">

- [x] Create a smart contract to swap SOL to MOVE token, for each SOL swapped we will receive 10 MOVE (the price is a constant).
* Link to smart contract: https://github.com/chungquantin/remitano-project/blob/master/programs/remitano-project/src/lib.rs

- [x] Smart contract have to be Solana testnet

* Smart contract address: `Cb95wqzowAjpuRi2yRoo9agiko6c5g3eTAWammsWwC1h`
* Testnet URL: https://explorer.solana.com/address/Cb95wqzowAjpuRi2yRoo9agiko6c5g3eTAWammsWwC1h?cluster=testnet

## Implementation

### Create new token

```
3trVWdP5LcofWPB6QzEzJjiMd3pwTNmLZRzijfJjWsV1
```

Using SPL token CLI to create and mint new token

```yaml
1016  spl-token
1017  spl-token accounts
1018  spl-token accounts mint
1019  spl-token accounts create-token
1020  spl-token create-token
1021  spl-token accounts
1022  spl-token balance
1023  spl-token create-account
1024  spl-token create-account 3trVWdP5LcofWPB6QzEzJjiMd3pwTNmLZRzijfJjWsV1
1025  spl-token balance
1026  spl-token accounts
1027  spl-token accounts | grep 9ReYN8PVF8qJtSbWXAsZknVfiT6ht3bnfQ9Kq8zFpSC5
1028  spl-token accounts 3trVWdP5LcofWPB6QzEzJjiMd3pwTNmLZRzijfJjWsV1
1029  spl-token mint 3trVWdP5LcofWPB6QzEzJjiMd3pwTNmLZRzijfJjWsV1
1030  spl-token create-account 3trVWdP5LcofWPB6QzEzJjiMd3pwTNmLZRzijfJjWsV1 10000
1031  spl-token mint 3trVWdP5LcofWPB6QzEzJjiMd3pwTNmLZRzijfJjWsV1 10000
```

### Test Anchor program

```
anchor test
```

### Deploy to Testnet

```
solana config set --url testnet
solana airdrop 1
anchor deploy
```

Update Anchor config file

```toml
[provider]
cluster = "testnet"
wallet = "/Users/chungquantin/snf-1.json"
```

### Create new liquidity Pool

```js
it("Is liquidity pool initialized!", async () => {
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
});
```
### Swap token SOL <> Test token

```tsx
it("Swap token", async () => {
   // Expected outcome: newAccount receives 1 test token, swap 1 SOL
   const { swapTokenData, transaction } = await remitanoService.swapToken(
     anchorProvider.wallet.publicKey,
     anchorProvider.wallet.publicKey,
     poolAddress,
     MINT_TOKEN_ADDRESS,
     new BN(LAMPORTS_PER_SOL * 1)
   );

   const swapIx = await program.methods
     .swapToken(swapTokenData.amount)
     .accounts(swapTokenData.ctx.accounts)
     .signers([])
     .instruction();

   transaction.instructions.push(swapIx);

   console.log(transaction.instructions);

   const tx = await anchorProvider.sendAndConfirm(transaction, []);
   console.log("Your transaction signature", tx);
});
```
