import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { UnsafeBurnerWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import type { FC, ReactNode } from 'react';
import React, { useMemo } from 'react';
import { Button, Card } from 'antd';
import { useLiquidityPool } from './hooks';

export const App: FC = () => {
    return (
        <Context>
            <Content />
        </Context>
    );
};

const Context: FC<{ children: ReactNode }> = ({ children }) => {
    // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
    const network = WalletAdapterNetwork.Devnet;
    // You can also provide a custom RPC endpoint.
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);
    const wallets = useMemo(() => [new UnsafeBurnerWalletAdapter()], [network]);
    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

const Content: FC = () => {
    const { wallet } = useWallet();
    useLiquidityPool();
    const requestSolAirdrop = () => {};

    return (
        <div>
            <WalletMultiButton />
            <div style={{ marginTop: 10 }}>
                {wallet ? (
                    <React.Fragment>Please connect to your wallet first</React.Fragment>
                ) : (
                    <React.Fragment>
                        <Button onClick={requestSolAirdrop}>Request 1 SOL airdrop</Button>
                        <Card title="Liquidity Pool"></Card>
                    </React.Fragment>
                )}
            </div>
        </div>
    );
};
