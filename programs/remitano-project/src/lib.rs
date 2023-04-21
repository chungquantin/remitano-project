use anchor_lang::prelude::*;
use anchor_spl::{associated_token, token};

// Declare program ID of Anchor smart contract
declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

// Constant seed prefix to intialize pool liquidity
pub const POOL_LIQUIDITY_PREFIX: &[u8; 14] = b"POOL_LIQUIDITY";
pub const POOL_MAX_NAME_LENGTH: u8 = 32;

#[program]
pub mod remitano_project {
    use super::*;

    pub fn initialize_pool(
        ctx: Context<InitializePoolInstructionParams>,
        client_pool: BasicLiquidityPool,
    ) -> Result<()> {
        initialize_pool_handler(ctx, client_pool)
    }

    /** Swap Instruction: Amount is lamport unit */
    pub fn swap(ctx: Context<SwapInstructionParams>, amount: u64) -> Result<()> {
        swap_token_handler(ctx, amount)
    }
}

/** Initialize pool handler */
pub fn initialize_pool_handler(
    ctx: Context<InitializePoolInstructionParams>,
    client_pool: BasicLiquidityPool,
) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    if client_pool.name.len() > POOL_MAX_NAME_LENGTH.into() {
        panic!("Exceed name length limit");
    }
    pool.signer_bump = client_pool.signer_bump;
    pool.pool_provider = ctx.accounts.payer.key();
    pool.created_at = Clock::get()?.unix_timestamp;
    pool.name = client_pool.name;

    Ok(())
}

/** Swap token handler */
pub fn swap_token_handler(ctx: Context<SwapInstructionParams>, amount: u64) -> Result<()> {
    let pool: &Account<BasicLiquidityPool> = &ctx.accounts.pool;
    let pool_key = &pool.key();
    // Transfer SOL to the pool
    anchor_lang::solana_program::system_instruction::transfer(
        &ctx.accounts.payer.key(),
        pool_key,
        amount,
    );
    let pool_seeds = &[
        POOL_LIQUIDITY_PREFIX.as_ref(),
        pool_key.as_ref(),
        &[pool.signer_bump],
    ];
    let signer = &[&pool_seeds[..]];
    // Transfer 10 MOVE token back to the swapper
    let cpi_context = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        token::Transfer {
            from: ctx.accounts.pool.to_account_info(),
            to: ctx.accounts.payer.to_account_info(),
            authority: ctx.accounts.pool_authority.to_account_info(),
        },
        signer,
    );
    // Cross-program invocation on the swap transaction, signed by the pool authority
    token::transfer(cpi_context, 10)?;
    msg!("Transferred successfully.");
    Ok(())
}

#[account]
#[derive(Default, Debug)]
/** BasicLiquidityPool implementation: Liquidity Pool holds token assets */
pub struct BasicLiquidityPool {
    pub name: String,
    pub created_at: i64,
    pub signer_bump: u8,
    pub pool_provider: Pubkey,
}

impl BasicLiquidityPool {
    pub fn space() -> usize {
        8    // Anchor account discriminator
        + 32 // name (limit to 32 bytes)
        + 8  // created_at
        + 32 // creator
        + 1  // signer_bump
        + std::mem::size_of::<Pubkey>()
    }
}

#[derive(Accounts)]
#[instruction(client_pool: BasicLiquidityPool)]
pub struct InitializePoolInstructionParams<'info> {
    /// CHECK: This is not dangerous because it is pool public key
    #[account(init, payer=payer, space=BasicLiquidityPool::space())]
    pub pool: Account<'info, BasicLiquidityPool>,
    /// CHECK: This is not dangerous because it requires pool authority seed by bump
    #[account(
        seeds = [
            POOL_LIQUIDITY_PREFIX.as_ref(),
            pool.key().as_ref()
        ],
        bump = pool.signer_bump
    )]
    pub pool_authority: AccountInfo<'info>,

    #[account(mut)]
    payer: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, token::Token>,
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct SwapInstructionParams<'info> {
    /// CHECK: This is not dangerous because it is pool public key
    #[account(mut)]
    pub pool: Account<'info, BasicLiquidityPool>,
    /// CHECK: This is not dangerous because it requires pool authority seed by bump
    #[account(
        seeds = [
            POOL_LIQUIDITY_PREFIX.as_ref(),
            pool.key().as_ref()
        ],
        bump = pool.signer_bump
    )]
    pub pool_authority: AccountInfo<'info>,

    #[account(mut)]
    payer: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, token::Token>,
    pub associated_token_program: Program<'info, associated_token::AssociatedToken>,
}
