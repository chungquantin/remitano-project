import * as borsh from "@project-serum/borsh";

import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

class InitializeAccount {
  instruction: number;
}

class InitializeMint {
  instruction: number;
  decimals: number;
  mintAuthority: PublicKey;
  freezeAuthority?: PublicKey;
}

class MintRequest {
  instruction: number;
  amount: BN;
}

class TransferRequest {
  instruction: number;
  amount: BN;
}

class TransferCheckedRequest {
  instruction: number;
  amount: BN;
  decimals: number;
}

export const TOKEN_PROGRAM_LAYOUT = {
  INITIALIZE_ACCOUNT: borsh.struct<InitializeAccount>([
    borsh.u8("instruction"),
  ]),
  INITIALIZE_MINT: borsh.struct<InitializeMint>([
    borsh.u8("instruction"),
    borsh.u8("decimals"),
    borsh.publicKey("mintAuthority"),
    borsh.option(borsh.publicKey(), "freezeAuthority"),
  ]),
  MINT: borsh.struct<MintRequest>([
    borsh.u8("instruction"),
    borsh.u64("amount"),
  ]),
  TRANSFER: borsh.struct<TransferRequest>([
    borsh.u8("instruction"),
    borsh.u64("amount"),
  ]),
  TRANSFER_CHECKED: borsh.struct<TransferCheckedRequest>([
    borsh.u8("instruction"),
    borsh.u64("amount"),
    borsh.u8("decimals"),
  ]),
};
