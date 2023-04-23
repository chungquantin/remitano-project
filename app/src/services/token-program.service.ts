import {
    Connection,
    Keypair,
    PublicKey,
    sendAndConfirmTransaction,
    SystemProgram,
    Transaction,
    TransactionInstruction,
} from '@solana/web3.js';
import * as splToken from '@solana/spl-token';
import BN from 'bn.js';
import { SolanaService } from './solana.service';
import { TokenProgramInstructionService } from './token-program-instruction.service';

export class TokenProgramService {
    static async checkAddressType(connection: Connection, address: PublicKey): Promise<number> {
        const accountInfo = await connection.getAccountInfo(address);
        if (accountInfo.owner.toBase58() === SystemProgram.programId.toBase58()) {
            return 1;
        }
        if (accountInfo.owner.toBase58() === splToken.TOKEN_PROGRAM_ID.toBase58()) {
            return 2;
        }
        return 0;
    }

    static async createAssociatedTokenAccount(
        connection: Connection,
        payerAccount: Keypair,
        ownerAddress: PublicKey,
        tokenMintAddress: PublicKey
    ): Promise<PublicKey> {
        const tokenAccountAddress = await TokenProgramService.findAssociatedTokenAddress(
            ownerAddress,
            tokenMintAddress
        );
        if (await SolanaService.isAddressInUse(connection, tokenAccountAddress)) {
            console.log(
                `SKIPPED: Associated Token Account ${tokenAccountAddress.toBase58()} of Account ${ownerAddress.toBase58()} is already existed`,
                '\n'
            );
            return tokenAccountAddress;
        }

        const transaction = new Transaction();

        const createATAInstruction = await TokenProgramInstructionService.createAssociatedTokenAccount(
            payerAccount.publicKey,
            ownerAddress,
            tokenMintAddress
        );
        transaction.add(createATAInstruction);

        const txSign = await sendAndConfirmTransaction(connection, transaction, [payerAccount]);
        console.log(
            `Created Associated Token Account ${tokenAccountAddress.toBase58()} for Account ${ownerAddress.toBase58()}`,
            '---',
            txSign,
            '\n'
        );
        return tokenAccountAddress;
    }

    static async findAssociatedTokenAddress(walletAddress: PublicKey, tokenMintAddress: PublicKey): Promise<PublicKey> {
        const [address] = await PublicKey.findProgramAddress(
            [walletAddress.toBuffer(), splToken.TOKEN_PROGRAM_ID.toBuffer(), tokenMintAddress.toBuffer()],
            splToken.ASSOCIATED_TOKEN_PROGRAM_ID
        );
        return address;
    }

    static async createAssociatedTokenAccountIfNotExist(
        connection: Connection,
        payer: PublicKey,
        owner: PublicKey,
        mint: PublicKey
    ): Promise<[PublicKey, TransactionInstruction[]]> {
        let ownerAccountInfo = await connection.getAccountInfo(owner);
        if (!TokenProgramInstructionService.isTokenAccount(ownerAccountInfo)) {
            const ata = await splToken.getAssociatedTokenAddress(
                mint,
                owner,
                true,
                splToken.TOKEN_PROGRAM_ID,
                splToken.ASSOCIATED_TOKEN_PROGRAM_ID
            );
            let ataInfo = await connection.getAccountInfo(ata);
            let instructions: TransactionInstruction[] = [];
            if (!ataInfo) {
                instructions.push(
                    await splToken.createAssociatedTokenAccountInstruction(
                        payer,
                        ata,
                        owner,
                        mint,
                        splToken.TOKEN_PROGRAM_ID,
                        splToken.ASSOCIATED_TOKEN_PROGRAM_ID
                    )
                );
            }
            return [ata, instructions];
        }
        return [owner, []];
    }

    static async createTransferTransaction(
        connection: Connection,
        payer: PublicKey,
        senderAccount: Keypair,
        recipientAddress: PublicKey,
        tokenMintAddress: PublicKey,
        amount: BN
    ): Promise<Transaction> {
        const transaction = new Transaction();
        let instructions: TransactionInstruction[] = [];
        const senderAddress = senderAccount.publicKey;
        let [senderTokenAddress, createSenderAtaIxs] = await this.createAssociatedTokenAccountIfNotExist(
            connection,
            payer,
            senderAddress,
            tokenMintAddress
        );
        if (createSenderAtaIxs) {
            instructions = instructions.concat(createSenderAtaIxs);
        }

        let [recipientTokenAddress, createRecipientAtaIxs] = await this.createAssociatedTokenAccountIfNotExist(
            connection,
            payer,
            recipientAddress,
            tokenMintAddress
        );
        if (createRecipientAtaIxs) {
            instructions = instructions.concat(createRecipientAtaIxs);
        }

        const transferTokenIx = splToken.createTransferInstruction(
            senderTokenAddress,
            recipientTokenAddress,
            senderAddress,
            amount.toNumber()
        );

        console.log(
            JSON.stringify(
                {
                    senderTokenAddress: senderTokenAddress.toString(),
                    recipientTokenAddress: recipientTokenAddress.toString(),
                    recipientAddress: recipientAddress.toString(),
                    senderAddress: senderAddress.toString(),
                },
                null,
                4
            )
        );
        instructions.push(transferTokenIx);

        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        transaction.instructions = instructions;
        transaction.recentBlockhash = blockhash;
        transaction.lastValidBlockHeight = lastValidBlockHeight;
        transaction.sign(senderAccount);

        console.log(
            `Transferred ${amount} token units from ${senderTokenAddress.toBase58()} to ${recipientTokenAddress.toBase58()}`
        );
        return transaction;
    }
}
