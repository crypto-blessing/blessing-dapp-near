use near_sdk::{Balance, Gas};

pub const ONE_YOCTO: Balance = 1;

pub const GAS_FOR_FT_TRANSFER: Gas = Gas(10_000_000_000_000);

pub const GAS_FOR_NFT_TRANSFER: Gas = Gas(15_000_000_000_000);

pub const DEPOSIT_FOR_NFT_MINT: Balance = 100_000_000_000_000_000_000_000;

pub const DEPOSIT_FOR_STRORAGE: Balance = 50_000_000_000_000_000_000_000;

pub const GAS_FOR_ACCOUNT_CREATION: Gas = Gas(150_000_000_000_000);

pub const GAS_FOR_ACCOUNT_CALLBACK: Gas = Gas(110_000_000_000_000);