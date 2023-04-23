import { AnchorProvider } from '@coral-xyz/anchor';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import { useMemo } from 'react';
import { PROGRAM_IDL } from '../constants/idl';
import { AnchorWallet, useAnchorWallet } from '@solana/wallet-adapter-react';
import { Program } from '@coral-xyz/anchor';
import { REMITANO_PROJECT_ID } from '../constants';

export function useAnchorProgram(): Program | undefined {
    const connection: Connection = new Connection(clusterApiUrl('testnet'));
    const walletCtx = useAnchorWallet();

    const anchorProgram = useMemo(() => {
        return walletCtx ? initAnchorProgram(connection, walletCtx) : undefined;
    }, [walletCtx?.publicKey]);

    return anchorProgram;
}

function initAnchorProgram(connection: Connection, walletCtx: AnchorWallet): Program {
    const provider = new AnchorProvider(connection, walletCtx, {
        skipPreflight: true,
        preflightCommitment: 'recent',
    });
    return new Program(PROGRAM_IDL as any, REMITANO_PROJECT_ID, provider);
}
