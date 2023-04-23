import * as borsh from '@project-serum/borsh';
import {
    AccountInfo,
    AccountMeta,
    PublicKey,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    TransactionInstruction,
} from '@solana/web3.js';
import BN from 'bn.js';
import { BorshService } from './borsh.service';
import { TOKEN_PROGRAM_LAYOUT } from './token.type';
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';

class CreateAssociatedTokenAccountRequest {}

const CREATE_ASSOCIATED_TOKEN_ACCOUNT_LAYOUT: borsh.Layout<CreateAssociatedTokenAccountRequest> = borsh.struct([]);

export interface TransferRequest {
    instruction: number;
    amount: BN;
}

const TRANSFER_LAYOUT: borsh.struct<TransferRequest> = borsh.struct([borsh.u8('instruction'), borsh.u64('amount')]);
export interface TokenMintData {
    mintAuthorityOption: number;
    mintAuthority: PublicKey;
    supply: BN;
    decimals: number;
    isInitialized: number;
    freezeAuthorityOption: number;
    freezeAuthority: PublicKey;
}

export interface TokenMintInfo {
    address: PublicKey;
    supply: BN;
    decimals: number;
    isInitialized: boolean;
    mintAuthority: null | PublicKey;
    freezeAuthority: null | PublicKey;
}

export class TokenProgramInstructionService {
    static async createAssociatedTokenAccount(
        payerAddress: PublicKey,
        ownerAddress: PublicKey,
        tokenMintAddress: PublicKey
    ): Promise<TransactionInstruction> {
        const tokenAccountAddress = await TokenProgramInstructionService.findAssociatedTokenAddress(
            ownerAddress,
            tokenMintAddress
        );
        const request = <CreateAssociatedTokenAccountRequest>{};
        const keys: AccountMeta[] = [
            <AccountMeta>{ pubkey: payerAddress, isSigner: true, isWritable: true },
            <AccountMeta>{
                pubkey: tokenAccountAddress,
                isSigner: false,
                isWritable: true,
            },
            <AccountMeta>{ pubkey: ownerAddress, isSigner: false, isWritable: false },
            <AccountMeta>{
                pubkey: tokenMintAddress,
                isSigner: false,
                isWritable: false,
            },
            <AccountMeta>{
                pubkey: SystemProgram.programId,
                isSigner: false,
                isWritable: false,
            },
            <AccountMeta>{
                pubkey: TOKEN_PROGRAM_ID,
                isSigner: false,
                isWritable: false,
            },
            <AccountMeta>{
                pubkey: SYSVAR_RENT_PUBKEY,
                isSigner: false,
                isWritable: false,
            },
        ];
        const data = BorshService.serialize(CREATE_ASSOCIATED_TOKEN_ACCOUNT_LAYOUT, request, 10);

        return new TransactionInstruction({
            keys,
            data,
            programId: ASSOCIATED_TOKEN_PROGRAM_ID,
        });
    }

    static isTokenAccount = (accountInfo: AccountInfo<Buffer>) => {
        return !!accountInfo && accountInfo.owner.equals(TOKEN_PROGRAM_ID);
    };

    static createTransferInstruction(
        ownerAddress: PublicKey,
        sourceTokenAddress: PublicKey,
        targetTokenAddress: PublicKey,
        amount: number
    ): TransactionInstruction {
        const keys: AccountMeta[] = [
            { pubkey: sourceTokenAddress, isSigner: false, isWritable: true },
            { pubkey: targetTokenAddress, isSigner: false, isWritable: true },
            { pubkey: ownerAddress, isSigner: true, isWritable: false },
        ];
        const data = BorshService.serialize(
            TOKEN_PROGRAM_LAYOUT.TRANSFER,
            {
                instruction: 3,
                amount: new BN(amount),
            },
            10
        );
        return new TransactionInstruction({
            keys,
            data,
            programId: TOKEN_PROGRAM_ID,
        });
    }

    static async findAssociatedTokenAddress(walletAddress: PublicKey, tokenMintAddress: PublicKey): Promise<PublicKey> {
        const [address] = await PublicKey.findProgramAddress(
            [walletAddress.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), tokenMintAddress.toBuffer()],
            ASSOCIATED_TOKEN_PROGRAM_ID
        );
        return address;
    }
}

export class AuthorityTypes {
    static MintTokens = 0;
    static FreezeAccount = 1;
    static AccountOwner = 2;
    static CloseAccount = 3;
}
