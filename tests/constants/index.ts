import { Keypair } from "@solana/web3.js";

/* accountFundLiquidity: tEUZ4FqdiwQrwWcUw9B2HNEb7Dq3wuVNkU2GErZsWbd */
export const getTestAccount = () => ({
  accountFundLiquidity: Keypair.fromSecretKey(
    new Uint8Array([
      24, 118, 235, 108, 32, 152, 159, 142, 173, 235, 192, 247, 63, 24, 24, 105,
      186, 41, 45, 3, 69, 229, 177, 89, 184, 182, 64, 135, 165, 184, 16, 97, 13,
      31, 219, 136, 40, 220, 232, 12, 223, 21, 51, 14, 61, 92, 17, 168, 206, 16,
      84, 165, 2, 220, 68, 222, 240, 130, 113, 3, 13, 18, 72, 28,
    ])
  ),
});
