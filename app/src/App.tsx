import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { UnsafeBurnerWalletAdapter } from '@solana/wallet-adapter-wallets';
import { LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';
import { FC, ReactNode, useEffect, useState } from 'react';
import React, { useMemo } from 'react';
import { Avatar, Button, Card, Divider, Input, Skeleton, Tag } from 'antd';
import { useAnchorProgram, useLiquidityPool } from './hooks';
import { MINT_TOKEN_ADDRESS, MOCK_POOL, REMITANO_PROJECT_ID } from './constants';
import { NumericInput } from './components';
import RemitanoService from './services/remitano.service';
import { BN } from 'bn.js';
import { TokenProgramService } from './services/token-program.service';

export const App: FC = () => {
    return (
        <Context>
            <div style={{ padding: '100px 0px' }}>
                <Content />
            </div>
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

const MIDDLE_STYLE: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
    alignItems: 'center',
};

const Content: FC = () => {
    const { wallet } = useWallet();
    const { connection, anchorProgram } = useAnchorProgram();
    const { pool, loading } = useLiquidityPool();
    const [value, setValue] = useState('');
    const [appLoading, setAppLoading] = useState(false);
    const [appRefreshing, setAppRefreshing] = useState(+new Date());
    const [balance, setBalance] = useState(0);
    const [tokenBalance, setTokenBalance] = useState(0);

    const requestSolAirdrop = async () => {
        if (!wallet || !wallet.adapter.publicKey) return;
        setAppLoading(true);
        const sol = LAMPORTS_PER_SOL;
        const signature = await connection.requestAirdrop(wallet.adapter.publicKey, sol);
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        // Confirm and send transaction
        await connection.confirmTransaction(
            {
                blockhash,
                lastValidBlockHeight,
                signature,
            },
            'finalized'
        );
        setAppLoading(false);
        setAppRefreshing(+new Date());
    };

    const handleRefresh = () => {
        setAppRefreshing(+new Date());
    };

    const handleSwap = async () => {
        try {
            setAppLoading(true);
            if (!wallet || !wallet.adapter.publicKey) return;
            const remitanoService = new RemitanoService(anchorProgram as any, connection);
            const { swapTokenData, transaction } = await remitanoService.swapToken(
                wallet.adapter.publicKey,
                wallet.adapter.publicKey,
                MOCK_POOL,
                MINT_TOKEN_ADDRESS,
                new BN(parseFloat(value) * LAMPORTS_PER_SOL)
            );

            const swapIx = await anchorProgram?.methods
                .swapToken(swapTokenData.amount)
                .accounts(swapTokenData.ctx.accounts)
                .instruction();
            if (!swapIx) throw new Error('No swap transaction initialized');
            transaction.instructions.push(swapIx);
            
            const {blockhash, lastValidBlockHeight} = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.lastValidBlockHeight = lastValidBlockHeight;

            const tx = await wallet.adapter.sendTransaction(transaction, connection, {
                maxRetries: 3,
                preflightCommitment: "confirmed"
            });
            const signatureResult = await connection.confirmTransaction(
                {
                    signature: tx,
                    blockhash: transaction.recentBlockhash,
                    lastValidBlockHeight: transaction.lastValidBlockHeight,
                },
                "finalized"
            );
            console.log(tx, signatureResult);
        } catch (error: any) {
            console.error(error);
        }
        setAppLoading(false);
        setAppRefreshing(+new Date());
    };

    useEffect(() => {
        const init = async () => {
            if (!wallet || !wallet.adapter.publicKey) return;
            setAppLoading(true);
            try {
                const _nativeBalance = await connection.getBalance(wallet.adapter.publicKey);

                const walletTokenAddress = await TokenProgramService.findAssociatedTokenAddress(
                    wallet.adapter.publicKey,
                    MINT_TOKEN_ADDRESS
                );
                const _tokenBalance = await connection.getTokenAccountBalance(walletTokenAddress);
                setTokenBalance(_tokenBalance.value.uiAmount || 0);
                setBalance(_nativeBalance);
            } catch (error) {
                console.error(error);
            }
            setAppLoading(false);
        };
        init();
    }, [wallet, wallet?.adapter.publicKey, appRefreshing]);

    return (
        <div style={MIDDLE_STYLE}>
            <h1 style={{ textAlign: 'center' }}>
                <Avatar
                    style={{ marginRight: 10 }}
                    src="https://walletscrutiny.com/images/wIcons/iphone/com.remitano.remitano.jpg"
                />
                Remitano Test Token Faucet
            </h1>
            <div
                style={{
                    marginTop: 40,
                    ...MIDDLE_STYLE,
                }}
            >
                <WalletMultiButton style={{ marginBottom: 50 }} />
                {appLoading ? (
                    <Skeleton />
                ) : (
                    <React.Fragment>
                        <div
                            style={{
                                ...MIDDLE_STYLE,
                            }}
                        >
                            {!wallet ? (
                                <React.Fragment>Please connect to your wallet first</React.Fragment>
                            ) : (
                                <React.Fragment>
                                    <Tag style={{ margin: '10px 0px' }}>Endpoint: {clusterApiUrl('testnet')}</Tag>
                                    <Tag style={{ margin: '10px 0px 20px 0px' }}>
                                        Contract address: {REMITANO_PROJECT_ID.toString()}
                                    </Tag>
                                    <div>
                                        <Button onClick={requestSolAirdrop} type="primary">
                                            Request 1 SOL airdrop
                                        </Button>
                                        <Button style={{ marginLeft: 10 }} onClick={handleRefresh}>
                                            Refresh
                                        </Button>
                                    </div>
                                    {!loading ? (
                                        pool ? (
                                            <React.Fragment>
                                                <Card style={{ marginTop: 20, width: 500 }} title="You wallet">
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span>SOL</span>
                                                        <span>{(balance / LAMPORTS_PER_SOL).toFixed(3)}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span>Test token</span>
                                                        <span>{tokenBalance}</span>
                                                    </div>
                                                </Card>
                                                <Card style={{ marginTop: 20, width: 500 }} title="Liquidity Pool">
                                                    <div>
                                                        <span style={{ fontWeight: 'bold' }}>Pool name: </span>
                                                        {pool?.name}
                                                    </div>
                                                    <div>
                                                        <span style={{ fontWeight: 'bold' }}>Vault address: </span>
                                                        {pool?.authority.toString()}
                                                    </div>
                                                    <div>
                                                        <span style={{ fontWeight: 'bold' }}>
                                                            Token associated address:{' '}
                                                        </span>
                                                        {pool?.ata.toString()}
                                                    </div>
                                                    <Divider />
                                                    <div>
                                                        <span style={{ fontWeight: 'bold' }}>Token address: </span>
                                                        {MINT_TOKEN_ADDRESS.toString()}
                                                    </div>
                                                    <div>
                                                        <span style={{ fontWeight: 'bold' }}>Amount: </span>
                                                        {pool?.amount.value.uiAmount}
                                                    </div>
                                                    <div>
                                                        <span style={{ fontWeight: 'bold' }}>Decimal: </span>
                                                        {pool?.amount.value.decimals}
                                                    </div>
                                                    <Divider />
                                                    <span style={{ fontWeight: 'bold' }}>Swapped Amount </span>
                                                    <p style={{ marginTop: 10 }}>1 SOL = 10 Test token</p>
                                                    <NumericInput
                                                        status={
                                                            parseFloat(value) > balance / LAMPORTS_PER_SOL
                                                                ? 'error'
                                                                : ''
                                                        }
                                                        prefixIcon={
                                                            <img
                                                                width={20}
                                                                style={{ marginRight: 10 }}
                                                                src="https://upload.wikimedia.org/wikipedia/en/b/b9/Solana_logo.png"
                                                            />
                                                        }
                                                        style={{ width: '100%', marginTop: 10, marginBottom: 20 }}
                                                        value={value}
                                                        onChange={setValue}
                                                    />
                                                    <span style={{ fontWeight: 'bold' }}>Received </span>
                                                    <Input
                                                        disabled
                                                        style={{ width: '100%', marginTop: 10 }}
                                                        value={parseFloat(value) * 10 || 0}
                                                    />
                                                    <Button
                                                        disabled={
                                                            parseFloat(value) > balance / LAMPORTS_PER_SOL ||
                                                            parseFloat(value) > pool.amount.value.uiAmount ||
                                                            parseFloat(value) === 0
                                                        }
                                                        style={{ marginTop: 15, width: '100%' }}
                                                        type={'primary'}
                                                        onClick={handleSwap}
                                                    >
                                                        Swap
                                                    </Button>
                                                    {parseFloat(value) > balance / LAMPORTS_PER_SOL ? (
                                                        <p style={{ color: 'red', marginTop: 20 }}>
                                                            Not enough SOL to swap
                                                        </p>
                                                    ) : (
                                                        <React.Fragment>
                                                            {parseFloat(value) > pool.amount.value.uiAmount && (
                                                                <p style={{ color: 'red', marginTop: 20 }}>
                                                                    Exceed limit of liquidity pool
                                                                </p>
                                                            )}
                                                        </React.Fragment>
                                                    )}
                                                </Card>
                                            </React.Fragment>
                                        ) : (
                                            <div>No pool found</div>
                                        )
                                    ) : (
                                        <Skeleton style={{ marginTop: 20 }} />
                                    )}
                                </React.Fragment>
                            )}
                        </div>
                    </React.Fragment>
                )}
            </div>
        </div>
    );
};
