# Blockchain Developer Project
- Candidate name: Tin Chung

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

- [x] Smart contract have to be Solana testnet

* Smart contract address: `Cb95wqzowAjpuRi2yRoo9agiko6c5g3eTAWammsWwC1h`
* Testnet URL: https://explorer.solana.com/address/Cb95wqzowAjpuRi2yRoo9agiko6c5g3eTAWammsWwC1h?cluster=testnet

## Implementation

### Create new token

Address of new token:

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
