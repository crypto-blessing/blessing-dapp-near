mod constants;

use std::str::FromStr;

use near_sdk::collections::{LookupMap};
use near_sdk::{
    borsh::{self, BorshDeserialize, BorshSerialize},
    ext_contract,
    serde::{Deserialize, Serialize},
    AccountId, PanicOnDefault, Promise, PromiseResult
};
use near_sdk::{json_types::U128, env, near_bindgen, PublicKey};
use near_sdk::json_types::Base64VecU8;
use near_sdk::{serde_json};
use constants::{ONE_YOCTO, GAS_FOR_FT_TRANSFER, GAS_FOR_NFT_TRANSFER, DEPOSIT_FOR_NFT_MINT, GAS_FOR_ACCOUNT_CREATION, GAS_FOR_ACCOUNT_CALLBACK, DEPOSIT_FOR_STRORAGE};
use near_contract_standards::non_fungible_token::{TokenId};
use near_contract_standards::non_fungible_token::metadata::{
    TokenMetadata,
};

#[ext_contract(ext_ft)]
pub trait ExtFt {

    #[payable]
    fn ft_transfer(
        &mut self, 
        receiver_id: AccountId, 
        amount: U128, 
        memo: Option<String>);

    #[payable]
    fn storage_deposit(
        &mut self,
        account_id: Option<AccountId>,
        registration_only: Option<bool>,
    ) -> StorageBalance;
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct StorageBalance {
    pub total: U128,
    pub available: U128,
}


#[ext_contract(ext_nft)]
pub trait ExtNft {
    #[payable]
    fn nft_mint(
        &mut self, 
        token_id: TokenId,
        receiver_id: AccountId,
        token_metadata: TokenMetadata);
}

#[ext_contract(ext_linkdrop)]
pub trait ExtLinkDropCrossContract {
    fn create_account(&mut self, new_account_id: AccountId, new_public_key: PublicKey) -> Promise;
}

pub trait AfterClaim {
    fn callback_after_create_account(
        &mut self,
        new_pk: PublicKey,
        sender: AccountId,
        claimer: AccountId,
        blessing_id: String,
        blessing: Blessing,
        choosed_blessing: SenderBlessing,
        distribution_amount: u128,
        claim_key: String,
        title: String,
        description: String,
    ) -> bool;
}

#[derive(BorshDeserialize, BorshSerialize, Deserialize, Serialize, Debug, Clone)]
#[serde(crate = "near_sdk::serde")]
pub enum ClaimType {
    Average,
    Random,
}

#[derive(BorshDeserialize, BorshSerialize, Deserialize, Serialize, Debug)]
#[serde(crate = "near_sdk::serde")]
pub struct Blessing {
    price: u128,
    owner_id: AccountId,
    deleted: u8,
    tax_rate: u128,
    ipfs: String,
}

#[derive(BorshDeserialize, BorshSerialize, Deserialize, Serialize, Debug, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct SenderBlessing  {
    blessing_id: String,
    blessing_image: String,
    send_timestamp: u64,
    token_amount: U128,
    claim_quantity: u16,
    claim_type: ClaimType,
    revoked: u8,
}

#[derive(BorshDeserialize, BorshSerialize, Deserialize, Serialize, Debug, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct ClaimerBlessing  {
    sender: AccountId,
    blessing_id: String,
    blessing_image: String,
    claim_timestamp: u64,
    claim_amount: U128,
    tax_amount: U128,
}

#[derive(BorshDeserialize, BorshSerialize, Deserialize, Serialize, Debug, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct BlessingClaimStatus  {
    claimer: AccountId,
    claim_timestamp: u64,
    distributed_amount: U128,
    claim_amount: U128,
    tax_amount: U128,
    cbt_token_reward_to_sender_amount: U128,
}

#[derive(BorshDeserialize, BorshSerialize, Deserialize, Serialize, Debug, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct ClaimSha256Status {
    hex: String,
    used: bool,
}

#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize, Debug)]
#[serde(crate = "near_sdk::serde")]
pub struct NewBlessingArgs {
    images: Vec<String>, 
    blessings: Vec<Blessing>,
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct BlessingAllInfo {
    blessing: Blessing,
    sender_blessing: SenderBlessing,
    blessing_claim_status: Vec<BlessingClaimStatus>,
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct CryptoBlessing {
    owner_id: AccountId,
    cbt_reward_ratio: u16,
    cbt_reward_max: u128,
    cbt_token_id: AccountId,
    nft_token_id: AccountId,
    claim_tax_rate: u16,  // 1000 means 1% tax rate
    blessing_map: LookupMap<String, Blessing>,
    sender_blessings: LookupMap<AccountId, Vec<SenderBlessing>>,
    claimer_blessings: LookupMap<AccountId, Vec<ClaimerBlessing>>,
    blessing_claim_status: LookupMap<String, Vec<BlessingClaimStatus>>,
    blessing_pubkey_status: LookupMap<String, Vec<ClaimSha256Status>>,
    /// When a user solves the puzzle and goes to claim the reward, they might need to create an account. This is the account that likely contains the "linkdrop" smart contract. https://github.com/near/near-linkdrop
    creator_account: AccountId,
}

#[near_bindgen]
impl CryptoBlessing {

    #[private]
    fn random_num() -> u128 {
        let mut random = env::block_timestamp() % 10;
        if random == 0 || random == 10 {
            random = 1
        }
        return random.into()
    }

    #[private]
    fn finalize_blessing_status(
        &mut self,
        new_pk: PublicKey,
        sender: AccountId,
        claimer: AccountId,
        blessing_id: String,
        blessing: Blessing,
        choosed_blessing: SenderBlessing,
        distribution_amount: u128,
        claim_key: String,
        title: String,
        description: String,
    ) {
        // Delete full access call
        // Promise::new(env::current_account_id()).delete_key(new_pk.clone());
        let mut claimer_blessings = self.claimer_blessings.get(&claimer).unwrap_or_default();
        claimer_blessings.push(ClaimerBlessing {
            sender: sender.clone(),
            blessing_id: blessing_id.clone(),
            blessing_image: choosed_blessing.blessing_image.clone(),
            claim_timestamp: env::block_timestamp(),
            claim_amount: near_sdk::json_types::U128(distribution_amount / 1000 * (1000 - self.claim_tax_rate as u128)),
            tax_amount: near_sdk::json_types::U128(distribution_amount / 1000 * self.claim_tax_rate as u128),
        });
        self.claimer_blessings.insert(&claimer, &claimer_blessings);

        let mut cbt_token_reward = distribution_amount * self.cbt_reward_ratio as u128;
        if cbt_token_reward > self.cbt_reward_max {
            cbt_token_reward = self.cbt_reward_max;
        }
        let mut blessing_claim_status = self.blessing_claim_status.get(&blessing_id).unwrap_or_default();
        blessing_claim_status.push(BlessingClaimStatus { 
            claimer: claimer.clone(), 
            claim_timestamp: env::block_timestamp(), 
            distributed_amount: near_sdk::json_types::U128(distribution_amount), 
            claim_amount: near_sdk::json_types::U128(distribution_amount / 1000 * (1000 - self.claim_tax_rate as u128)), 
            tax_amount: near_sdk::json_types::U128(distribution_amount / 1000 * self.claim_tax_rate as u128), 
            cbt_token_reward_to_sender_amount: near_sdk::json_types::U128(cbt_token_reward) 
        });
        self.blessing_claim_status.insert(&blessing_id, &blessing_claim_status);

        Promise::new(env::current_account_id()).transfer(distribution_amount / 1000 * self.claim_tax_rate as u128);

        // ext_ft::ft_transfer(sender, near_sdk::json_types::U128(cbt_token_reward), None, self.cbt_token_id.clone(), ONE_YOCTO, GAS_FOR_FT_TRANSFER);
        // ext_nft::nft_mint(claimer, token_id, token_uri, account_id, balance, gas);
        ext_ft::ext(self.cbt_token_id.clone())
            .with_attached_deposit(DEPOSIT_FOR_STRORAGE)
            .storage_deposit(Some(sender.clone()), Some(true)).then(
                ext_ft::ext(self.cbt_token_id.clone())
                .with_attached_deposit(ONE_YOCTO)
                    .with_static_gas(GAS_FOR_FT_TRANSFER)
                    .ft_transfer(sender.clone(), near_sdk::json_types::U128(cbt_token_reward), None)
            );

        ext_nft::ext(self.nft_token_id.clone())
            .with_attached_deposit(DEPOSIT_FOR_NFT_MINT)
            .with_static_gas(GAS_FOR_NFT_TRANSFER)
            .nft_mint(claim_key.clone(), claimer.clone(), TokenMetadata { 
                title: Some(title), 
                description: Some(description),
                media: Some(blessing.ipfs), 
                copies: Some(1), 
                media_hash: None, issued_at: None, expires_at: None, starts_at: None, updated_at: None, extra: None, reference:None, reference_hash:None
            });
            
    }
}

#[near_bindgen]
impl AfterClaim for CryptoBlessing {

    #[private]
    fn callback_after_create_account(
        &mut self,
        new_pk: PublicKey,
        sender: AccountId,
        claimer: AccountId,
        blessing_id: String,
        blessing: Blessing,
        choosed_blessing: SenderBlessing,
        distribution_amount: u128,
        claim_key: String,
        title: String,
        description: String,
    ) -> bool {
        assert_eq!(
            env::promise_results_count(),
            1,
            "Expected 1 promise result."
        );
        match env::promise_result(0) {
            PromiseResult::NotReady => {
                unreachable!()
            }
            PromiseResult::Successful(creation_result) => {
                let creation_succeeded: bool = serde_json::from_slice(&creation_result)
                    .expect("Could not turn result from account creation into boolean.");
                if creation_succeeded {
                    // New account created and reward transferred successfully.
                    self.finalize_blessing_status(new_pk, sender, claimer, blessing_id, blessing, choosed_blessing, distribution_amount, claim_key, title, description);
                    true
                } else {
                    // Something went wrong trying to create the new account.
                    false
                }
            }
            PromiseResult::Failed => {
                // Problem with the creation transaction, reward money has been returned to this contract.
                false
            }
        }
    }

}


#[near_bindgen]
impl CryptoBlessing {

    #[init]
    pub fn new(owner_id: AccountId, creator_account: AccountId) -> Self {
        Promise::new(env::current_account_id()).add_access_key(
            PublicKey::from_str("ed25519:Pfie3pocS7H5rgVdeC322zUcKwJ1hLSrSRVJpVoiwtR").unwrap(),
            250000000000000000000000,
            env::current_account_id(),
            "claim_blessing_new_account".to_string(),
        );
        Self {
            owner_id,
            cbt_reward_ratio: 5,
            cbt_reward_max: 100_000_000_000_000_000_000_000_000,
            cbt_token_id: AccountId::new_unchecked("token.cryptoblessing.near".to_string()),
            nft_token_id: AccountId::new_unchecked("nft.cryptoblessing.near".to_string()),
            // cbt_token_id: AccountId::new_unchecked("token.cryptoblessing.testnet".to_string()),
            // nft_token_id: AccountId::new_unchecked("nft_v2.cryptoblessing.testnet".to_string()),
            claim_tax_rate: 10,
            blessing_map: LookupMap::new(b"b"),
            sender_blessings: LookupMap::new(b"s"),
            claimer_blessings: LookupMap::new(b"c"),
            blessing_claim_status: LookupMap::new(b"d"),
            blessing_pubkey_status: LookupMap::new(b"p"),
            creator_account
        }
    }

    pub fn update_token_info(&mut self, 
        cbt_reward_max : u128, 
        cbt_reward_ratio : u16, 
        cbt_token_id: AccountId,
        nft_token_id: AccountId) {
        assert_eq!(
            env::predecessor_account_id(),
            self.owner_id,
            "Only &the owner may call this method"
        );
        self.cbt_reward_max = cbt_reward_max;
        self.cbt_reward_ratio = cbt_reward_ratio;
        self.cbt_token_id = cbt_token_id;
        self.nft_token_id = nft_token_id;
    }

    pub fn update_claim_tax_rate(&mut self, claim_tax_rate : u16) {
        assert_eq!(
            env::predecessor_account_id(),
            self.owner_id,
            "Only &the owner may call this method"
        );
        self.claim_tax_rate = claim_tax_rate;
    }

    pub fn new_blessing(&mut self, 
        image: String,
        price: u128,
        tax_rate: u128,
        ipfs: String,
        owner_id: AccountId
    ) {
        assert_eq!(
            env::predecessor_account_id(),
            self.owner_id,
            "Only &the owner may call this method"
        );
        self.blessing_map.insert(
            &image,
            &Blessing {
                price,
                owner_id,
                deleted: 0,
                tax_rate,
                ipfs
            }
        );
    }

    pub fn new_blessings(&mut self, args: Base64VecU8) {
        assert_eq!(
            env::predecessor_account_id(),
            self.owner_id,
            "Only &the owner may call this method"
        );
        let blessing_args: NewBlessingArgs = serde_json::from_slice(&args.0.as_slice()).unwrap();
        for(image, blessing) in blessing_args.images.iter().zip(blessing_args.blessings.iter()) {
            self.blessing_map.insert(&image.clone(), blessing.clone());
        }
    }

    pub fn my_sended_blessings(&self, sender: AccountId) -> Vec<SenderBlessing> {
        self.sender_blessings.get(&sender).unwrap_or(vec![])
    }

    pub fn my_claimed_blessings(&self, claimer: AccountId) -> Vec<ClaimerBlessing> {
        self.claimer_blessings.get(&claimer).unwrap_or(vec![])
    }

    pub fn get_blessing_pubkey_status(&self, blessing_id: String) -> Vec<ClaimSha256Status> {
        self.blessing_pubkey_status.get(&blessing_id).unwrap_or(vec![])
    }

    pub fn get_all_info_of_blessing(&self, sender: AccountId, blessing_id: String) -> BlessingAllInfo {
        let sender_blessings = self.sender_blessings.get(&sender).unwrap_or(vec![]);
        let sender_blessing = sender_blessings.iter()
            .find(|b| b.blessing_id == blessing_id)
            .expect("Blessing not found");
        let blessing = self.blessing_map.get(&sender_blessing.blessing_image).unwrap();
        let blessing_claim_status = self.blessing_claim_status.get(&blessing_id).unwrap_or(vec![]);
        BlessingAllInfo {
            blessing,
            sender_blessing: sender_blessing.clone(),
            blessing_claim_status
        }
    }

    #[payable]
    pub fn send_blessing(
        &mut self, 
        blessing_image: String,
        blessing_id: String,
        claim_quantity: u16,
        claim_type: ClaimType,
        hexex: Vec<String>) {
            
        let sender = env::predecessor_account_id();
        let total_amount = env::attached_deposit();
        let blessing = self.blessing_map
            .get(&blessing_image)
            .expect("Blessing image not found");
        let blessing_total_amount = blessing.price * claim_quantity as u128;
        assert!(total_amount >= blessing_total_amount, "Insufficient amount");
        let token_amount = total_amount - blessing_total_amount;
        assert!(claim_quantity > 0 && claim_quantity <= 13, "Claim quantity must be greater than 0 and less or equal than 13");
        assert!(claim_quantity as usize == hexex.len(), "Number of pubkeys must be equal to claim quantity");
        assert!(blessing.price > 0 && blessing.deleted == 0, "Blessing is deleted");
        let mut sender_blessings = self.sender_blessings.get(&sender).unwrap_or_default();
        sender_blessings.push(SenderBlessing {
            blessing_id: blessing_id.clone(),
            blessing_image,
            send_timestamp: env::block_timestamp(),
            token_amount: near_sdk::json_types::U128(token_amount),
            claim_quantity,
            claim_type,
            revoked: 0,
        });
        self.sender_blessings.insert(&sender, &sender_blessings);
        // transfer to owners
        Promise::new(blessing.owner_id.clone()).transfer(blessing_total_amount * (100 - blessing.tax_rate) / 100);
        Promise::new(self.owner_id.clone()).transfer(blessing_total_amount * blessing.tax_rate / 100);

        // update pubkey status
        let mut pubkey_status = self.blessing_pubkey_status.get(&blessing_id).unwrap_or_default();
        for hex in hexex.iter() {
            pubkey_status.push(ClaimSha256Status {
                hex: hex.clone(),
                used: false,
            });
        }
        self.blessing_pubkey_status.insert(&blessing_id, &pubkey_status);

    }

    pub fn revoke_blessing(&mut self, blessing_id: String) {
        let blessing_claim_status = self.blessing_claim_status.get(&blessing_id).unwrap_or_default();
        assert!(blessing_claim_status.len() == 0, "Blessing is claimed");
        let sender = env::predecessor_account_id();
        let mut sender_blessings = self.sender_blessings.get(&sender).unwrap_or_default();
        let mut found = false;
        let mut token_amount = 0;
        for i in 0..sender_blessings.len() {
            if sender_blessings[i].blessing_id == blessing_id {
                found = true;
                token_amount = sender_blessings[i].token_amount.0;
                sender_blessings[i].revoked = 1;
                break;
            }
        }
        if found {
            self.sender_blessings.insert(&sender, &sender_blessings);
            Promise::new(sender.clone()).transfer(token_amount);
        }
    }

    pub fn claim_blessing(
        &mut self,
        sender: AccountId,
        claimer: AccountId,
        blessing_id: String,
        claim_key: String,
        title: String,
        description: String,
    ) {
        assert!(env::predecessor_account_id() == env::signer_account_id() 
            && claimer == env::predecessor_account_id(), "Only account can claim blessings");
        let hashed_input = env::sha256(claim_key.as_bytes());
        let claim_key_hex = hex::encode(&hashed_input);
        let mut pubkey_status = self.blessing_pubkey_status.get(&blessing_id).unwrap_or_default();
        assert!(pubkey_status.len() > 0, "No pubkeys found");

        let mut found = false;
        for(i, status) in pubkey_status.iter().enumerate() {
            if status.hex == claim_key_hex {
                found = true;
                pubkey_status[i].used = true;
                break;
            }
        }
        assert!(found, "Claim key not found");
        self.blessing_pubkey_status.insert(&blessing_id, &pubkey_status);

        let sender_blessings = self.sender_blessings.get(&sender).unwrap_or_default();
        let choosed_blessing = sender_blessings.iter()
            .find(|b| b.blessing_id == blessing_id)
            .expect("Blessing not found");
        // choosed blessing not found
        assert!(choosed_blessing.revoked == 0, "Blessing is revoked");


        let blessing = self.blessing_map
            .get(&choosed_blessing.blessing_image)
            .expect("Blessing not found");

        let mut blessing_claim_status = self.blessing_claim_status.get(&blessing_id).unwrap_or_default();
        assert!(blessing_claim_status.len() < choosed_blessing.claim_quantity as usize, "Claim quantity is exceeded");

        let mut distributed_amount = 0;
        for status in blessing_claim_status.iter() {
            assert!(status.claimer != claimer, "You have already claimed this blessing");
            distributed_amount += status.distributed_amount.0;
        }

        let distribution_amount;
        match choosed_blessing.claim_type {
            ClaimType::Average=>{
                distribution_amount = choosed_blessing.token_amount.0 / choosed_blessing.claim_quantity as u128;
            },
            ClaimType::Random => {
                let left_quantity = choosed_blessing.claim_quantity - blessing_claim_status.len() as u16;
                let random_num = CryptoBlessing::random_num();
                if left_quantity == 1 {
                    distribution_amount = choosed_blessing.token_amount.0 - distributed_amount;
                } else {
                    distribution_amount = (choosed_blessing.token_amount.0 - distributed_amount) / (left_quantity as u128) * random_num as u128 / 10 * 2;
                }
            }, 
        }

        assert!(distribution_amount > DEPOSIT_FOR_NFT_MINT, "Distribution amount is too low");

        let mut claimer_blessings = self.claimer_blessings.get(&claimer).unwrap_or_default();
        claimer_blessings.push(ClaimerBlessing {
            sender: sender.clone(),
            blessing_id: blessing_id.clone(),
            blessing_image: choosed_blessing.blessing_image.clone(),
            claim_timestamp: env::block_timestamp(),
            claim_amount: near_sdk::json_types::U128(distribution_amount / 1000 * (1000 - self.claim_tax_rate as u128)),
            tax_amount: near_sdk::json_types::U128(distribution_amount / 1000 * self.claim_tax_rate as u128),
        });
        self.claimer_blessings.insert(&claimer, &claimer_blessings);

        let mut cbt_token_reward = distribution_amount * self.cbt_reward_ratio as u128;
        if cbt_token_reward > self.cbt_reward_max {
            cbt_token_reward = self.cbt_reward_max;
        }

        blessing_claim_status.push(BlessingClaimStatus { 
            claimer: claimer.clone(), 
            claim_timestamp: env::block_timestamp(), 
            distributed_amount: near_sdk::json_types::U128(distribution_amount), 
            claim_amount: near_sdk::json_types::U128(distribution_amount / 1000 * (1000 - self.claim_tax_rate as u128)), 
            tax_amount: near_sdk::json_types::U128(distribution_amount / 1000 * self.claim_tax_rate as u128), 
            cbt_token_reward_to_sender_amount: near_sdk::json_types::U128(cbt_token_reward) 
        });
        self.blessing_claim_status.insert(&blessing_id, &blessing_claim_status);

        Promise::new(claimer.clone()).transfer((distribution_amount - DEPOSIT_FOR_NFT_MINT) / 1000 * (1000 - self.claim_tax_rate as u128));
        Promise::new(env::current_account_id()).transfer(distribution_amount / 1000 * self.claim_tax_rate as u128);

        // ext_ft::ft_transfer(sender, near_sdk::json_types::U128(cbt_token_reward), None, self.cbt_token_id.clone(), ONE_YOCTO, GAS_FOR_FT_TRANSFER);
        // ext_nft::nft_mint(claimer, token_id, token_uri, account_id, balance, gas);
        ext_ft::ext(self.cbt_token_id.clone())
            .with_attached_deposit(ONE_YOCTO)
            .with_static_gas(GAS_FOR_FT_TRANSFER)
            .ft_transfer(sender, near_sdk::json_types::U128(cbt_token_reward), None);

        ext_nft::ext(self.nft_token_id.clone())
            .with_attached_deposit(DEPOSIT_FOR_NFT_MINT)
            .with_static_gas(GAS_FOR_NFT_TRANSFER)
            .nft_mint(claim_key, claimer.clone(), TokenMetadata { 
                title: Some(title), 
                description: Some(description),
                media: Some(blessing.ipfs), 
                copies: Some(1), 
                media_hash: None, issued_at: None, expires_at: None, starts_at: None, updated_at: None, extra: None, reference:None, reference_hash:None
            });

    }

    pub fn claim_blessing_new_account (
        &mut self,
        sender: AccountId,
        new_acc_id: String,
        new_pk: PublicKey,
        blessing_id: String,
        claim_key: String,
        title: String,
        description: String,
    ) {
        assert!(env::predecessor_account_id() == env::signer_account_id(), "Only account can claim blessings");
        let hashed_input = env::sha256(claim_key.as_bytes());
        let claim_key_hex = hex::encode(&hashed_input);
        let mut pubkey_status = self.blessing_pubkey_status.get(&blessing_id).unwrap_or_default();
        assert!(pubkey_status.len() > 0, "No pubkeys found");

        let mut found = false;
        for(i, status) in pubkey_status.iter().enumerate() {
            if status.hex == claim_key_hex {
                found = true;
                pubkey_status[i].used = true;
                break;
            }
        }
        assert!(found, "Claim key not found");
        self.blessing_pubkey_status.insert(&blessing_id, &pubkey_status);

        let sender_blessings = self.sender_blessings.get(&sender).unwrap_or_default();
        let choosed_blessing = sender_blessings.iter()
            .find(|b| b.blessing_id == blessing_id)
            .expect("Blessing not found");
        // choosed blessing not found
        assert!(choosed_blessing.revoked == 0, "Blessing is revoked");


        let blessing = self.blessing_map
            .get(&choosed_blessing.blessing_image)
            .expect("Blessing not found");

        let blessing_claim_status = self.blessing_claim_status.get(&blessing_id).unwrap_or_default();
        assert!(blessing_claim_status.len() < choosed_blessing.claim_quantity as usize, "Claim quantity is exceeded");

        let mut distributed_amount = 0;
        for status in blessing_claim_status.iter() {
            distributed_amount += status.distributed_amount.0;
        }

        let distribution_amount;
        match choosed_blessing.claim_type {
            ClaimType::Average=>{
                distribution_amount = choosed_blessing.token_amount.0 / choosed_blessing.claim_quantity as u128;
            },
            ClaimType::Random => {
                let left_quantity = choosed_blessing.claim_quantity - blessing_claim_status.len() as u16;
                let random_num = CryptoBlessing::random_num();
                if left_quantity == 1 {
                    distribution_amount = choosed_blessing.token_amount.0 - distributed_amount;
                } else {
                    distribution_amount = (choosed_blessing.token_amount.0 - distributed_amount) / (left_quantity as u128) * random_num as u128 / 10 * 2;
                }
            }, 
        }

        assert!(distribution_amount > DEPOSIT_FOR_NFT_MINT, "Distribution amount is too low");

        ext_linkdrop::ext(AccountId::from(self.creator_account.clone()))
            .with_attached_deposit((distribution_amount - DEPOSIT_FOR_NFT_MINT - DEPOSIT_FOR_STRORAGE) / 1000 * (1000 - self.claim_tax_rate as u128))
            .with_static_gas(GAS_FOR_ACCOUNT_CREATION) // This amount of gas will be split
            .create_account(new_acc_id.parse().unwrap(), new_pk.clone())
            .then(
                Self::ext(env::current_account_id())
                    .with_static_gas(GAS_FOR_ACCOUNT_CALLBACK)
                    .callback_after_create_account(new_pk, sender, AccountId::new_unchecked(new_acc_id.to_string()), blessing_id, blessing, choosed_blessing.clone(), distribution_amount, claim_key, title, description),
            );

    }

}

/*
 * the rest of this file sets up unit tests
 * to run these, the command will be:
 * cargo test --package rust-template -- --nocapture
 * Note: 'rust-template' comes from Cargo.toml's 'name' key
 */

// use the attribute below for unit tests
#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::{VMContextBuilder};
    use near_sdk::{testing_env, AccountId};

    #[test]
    fn debug_get_hash() {
        // Basic set up for a unit test
        testing_env!(VMContextBuilder::new().build());

        // Using a unit test to rapidly debug and iterate
        let debug_solution = "near nomicon ref finance";
        let debug_hash_bytes = env::sha256(debug_solution.as_bytes());
        let debug_hash_string = hex::encode(debug_hash_bytes);
        println!("Let's debug: {:?}", debug_hash_string);
    }

    // part of writing unit tests is setting up a mock context
    // provide a `predecessor` here, it'll modify the default context
    fn get_context(predecessor: AccountId) -> VMContextBuilder {
        let mut builder = VMContextBuilder::new();
        builder.predecessor_account_id(predecessor);
        builder
    }

    #[test]
    fn blesssing_test() {
        // Get Alice as an account ID
        let alice = AccountId::new_unchecked("alice.testnet".to_string());
        let testnet = AccountId::new_unchecked("testnet".to_string());
        // Set up the testing context and unit test environment
        let context = get_context(alice.clone());
        testing_env!(context.build());

        // Set up contract object and call the new method
        let mut contract = CryptoBlessing::new(alice.clone(), testnet.clone());


        // Add blessings
        // contract.new_blessings(Base64VecU8("ewogICAgImltYWdlcyI6IFsKICAgICAgICAibGF6eV9sb3ZlLmdpZiIsCiAgICAgICAgImdvZGRlc3NfYmxlc3NpbmcuZ2lmIiwKICAgICAgICAiSV9hZG9yZV95b3UuZ2lmIiwKICAgICAgICAiMTJfbG92ZS5naWYiLAogICAgICAgICJtaXJhYmlsaXNfbGFkeS5naWYiLAogICAgICAgICJZT1UrTUUuZ2lmIgogICAgXSwKICAgICJibGVzc2luZ3MiOiBbCiAgICAgICAgewogICAgICAgICAgICAicHJpY2UiOiAiMTAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwIiwKICAgICAgICAgICAgIm93bmVyX2lkIjogImNyeXB0b19ibGVzc2luZ185NTI3LnRlc3RuZXQiLAogICAgICAgICAgICAiZGVsZXRlZCI6IDAsCiAgICAgICAgICAgICJ0YXhfcmF0ZSI6IDEwCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAgICJwcmljZSI6ICI1MDAwMDAwMDAwMDAwMDAwMDAwMDAwMCIsCiAgICAgICAgICAgICJvd25lcl9pZCI6ICJjcnlwdG9fYmxlc3NpbmdfOTUyNy50ZXN0bmV0IiwKICAgICAgICAgICAgImRlbGV0ZWQiOiAwLAogICAgICAgICAgICAidGF4X3JhdGUiOiAxMAogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgICAicHJpY2UiOiAiNTAwMDAwMDAwMDAwMDAwMDAwMDAwMDAiLAogICAgICAgICAgICAib3duZXJfaWQiOiAiY3J5cHRvX2JsZXNzaW5nXzk1MjcudGVzdG5ldCIsCiAgICAgICAgICAgICJkZWxldGVkIjogMCwKICAgICAgICAgICAgInRheF9yYXRlIjogMTAKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICAgInByaWNlIjogIjUwMDAwMDAwMDAwMDAwMDAwMDAwMDAwIiwKICAgICAgICAgICAgIm93bmVyX2lkIjogImNyeXB0b19ibGVzc2luZ185NTI3LnRlc3RuZXQiLAogICAgICAgICAgICAiZGVsZXRlZCI6IDAsCiAgICAgICAgICAgICJ0YXhfcmF0ZSI6IDEwCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAgICJwcmljZSI6ICI1MDAwMDAwMDAwMDAwMDAwMDAwMDAwMCIsCiAgICAgICAgICAgICJvd25lcl9pZCI6ICJjcnlwdG9fYmxlc3NpbmdfOTUyNy50ZXN0bmV0IiwKICAgICAgICAgICAgImRlbGV0ZWQiOiAwLAogICAgICAgICAgICAidGF4X3JhdGUiOiAxMAogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgICAicHJpY2UiOiAiMTAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwIiwKICAgICAgICAgICAgIm93bmVyX2lkIjogImNyeXB0b19ibGVzc2luZ185NTI3LnRlc3RuZXQiLAogICAgICAgICAgICAiZGVsZXRlZCI6IDAsCiAgICAgICAgICAgICJ0YXhfcmF0ZSI6IDEwCiAgICAgICAgfQogICAgXQp9".as_bytes().to_vec()));
        contract.new_blessing("image1.gif".to_string(), 100_000_000_000_000_000_000_000, 10, "ipfs".to_string(), alice.clone());
        let blessing1 = contract.blessing_map.get(&"image1.gif".to_string()).unwrap();
        assert_eq!(blessing1.price, 100_000_000_000_000_000_000_000);

        //gen random pubkey


        // start to send blessing
        // log!("env::account_balance: {:?}", env::account_balance());
        // contract.send_blessing("image1.gif".to_string(), "blessing_id".to_string(), 2, ClaimType::Random, vec!["123".to_string(), "456".to_string()]);
        


    }

}
