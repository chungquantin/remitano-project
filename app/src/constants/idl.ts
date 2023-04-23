export const PROGRAM_IDL = {
    version: '0.1.0',
    name: 'remitano_project',
    instructions: [
        {
            name: 'initializePool',
            accounts: [
                {
                    name: 'pool',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'poolAuthority',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'payer',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'systemProgram',
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: 'clientPool',
                    type: {
                        defined: 'BasicLiquidityPool',
                    },
                },
            ],
        },
        {
            name: 'swapToken',
            docs: ['Swap Instruction: Amount is lamport unit'],
            accounts: [
                {
                    name: 'pool',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'poolAuthority',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'sender',
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: 'senderTokenAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'poolTokenAccount',
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: 'systemProgram',
                    isMut: false,
                    isSigner: false,
                },
                {
                    name: 'tokenProgram',
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: 'amount',
                    type: 'u64',
                },
            ],
        },
    ],
    accounts: [
        {
            name: 'BasicLiquidityPool',
            docs: [
                'BasicLiquidityPool implementation: Liquidity Pool holds token assets\n * The pool is designed for swapping between native SOL <> SPL Token',
            ],
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'name',
                        type: 'string',
                    },
                    {
                        name: 'createdAt',
                        type: 'i64',
                    },
                    {
                        name: 'signerBump',
                        type: 'u8',
                    },
                    {
                        name: 'poolProvider',
                        type: 'publicKey',
                    },
                ],
            },
        },
    ],
    metadata: {
        address: 'Cb95wqzowAjpuRi2yRoo9agiko6c5g3eTAWammsWwC1h',
    },
};
