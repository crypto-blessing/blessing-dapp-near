use rand::Rng;
use near_sdk::collections::{LookupMap, UnorderedSet};
use near_sdk::{
    borsh::{self, BorshDeserialize, BorshSerialize},
    log,
    serde::{Deserialize, Serialize},
    AccountId, PanicOnDefault, Promise,Balance
};
use near_sdk::{json_types::U128, env, near_bindgen, PublicKey};
use near_sdk::json_types::Base64VecU8;
use near_sdk::{serde_json, Gas};

#[derive(BorshDeserialize, BorshSerialize, Deserialize, Serialize, Debug)]
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
}

#[derive(BorshDeserialize, BorshSerialize, Deserialize, Serialize, Debug)]
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

#[derive(BorshDeserialize, BorshSerialize, Deserialize, Serialize, Debug)]
#[serde(crate = "near_sdk::serde")]
pub struct ClaimerBlessing  {
    sender: AccountId,
    blessing_id: String,
    blessing_image: String,
    claim_timestamp: u64,
    claim_amount: U128,
    tax_amount: U128,
}

#[derive(BorshDeserialize, BorshSerialize, Deserialize, Serialize, Debug)]
#[serde(crate = "near_sdk::serde")]
pub struct BlessingClaimStatus  {
    claimer: AccountId,
    claim_timestamp: u64,
    distributed_amount: U128,
    claim_amount: U128,
    tax_amount: U128,
    cbt_token_reward_to_sender_amount: U128,
}

#[derive(BorshDeserialize, BorshSerialize, Deserialize, Serialize, Debug)]
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

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct CryptoBlessing {
    owner_id: AccountId,
    cbt_reward_ratio: u16,
    cbt_reward_max: u128,
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
    fn random_num(max: u16) -> u16 {
        let mut rng = rand::thread_rng();
        rng.gen_range(1..max-1)
    }

}

#[near_bindgen]
impl CryptoBlessing {

    #[init]
    pub fn new(owner_id: AccountId, creator_account: AccountId) -> Self {
        Self {
            owner_id,
            cbt_reward_ratio: 5,
            cbt_reward_max: 100_000_000_000_000_000_000_000_000,
            claim_tax_rate: 10,
            blessing_map: LookupMap::new(b"b"),
            sender_blessings: LookupMap::new(b"s"),
            claimer_blessings: LookupMap::new(b"c"),
            blessing_claim_status: LookupMap::new(b"d"),
            blessing_pubkey_status: LookupMap::new(b"p"),
            creator_account
        }
    }

    pub fn update_cbt_reward(&mut self, cbt_reward_max : u128, cbt_reward_ratio : u16) {
        assert_eq!(
            env::predecessor_account_id(),
            self.owner_id,
            "Only &the owner may call this method"
        );
        self.cbt_reward_max = cbt_reward_max;
        self.cbt_reward_ratio = cbt_reward_ratio;
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

    pub fn claim_blessing(
        &mut self,
        sender: AccountId,
        claimer: AccountId,
        blessing_id: String,
        claim_key: String,
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

        let mut blessing_claim_status = self.blessing_claim_status.get(&blessing_id).unwrap_or_default();
        assert!(blessing_claim_status.len() < choosed_blessing.claim_quantity as usize, "Claim quantity is exceeded");

        let mut distributed_amount = 0;
        for status in blessing_claim_status.iter() {
            assert!(status.claimer != claimer, "You have already claimed this blessing");
            distributed_amount += status.distributed_amount.0;
        }

        let mut distribution_amount = 0;
        match choosed_blessing.claim_type {
            ClaimType::Average=>{
                distribution_amount = choosed_blessing.token_amount.0 / choosed_blessing.claim_quantity as u128;
            },
            ClaimType::Random => {
                let left_quantity = choosed_blessing.claim_quantity - blessing_claim_status.len() as u16;
                let random_num = CryptoBlessing::random_num(10);
                if left_quantity == 1 {
                    distribution_amount = choosed_blessing.token_amount.0 - distributed_amount;
                } else {
                    distribution_amount = (choosed_blessing.token_amount.0 - distributed_amount) / (left_quantity as u128) * random_num as u128 / 10 * 2;
                }
            }, 
        }

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
    use std::vec;

    use super::*;
    use near_sdk::test_utils::{get_logs, VMContextBuilder};
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

    fn get_blessings() -> Vec<Blessing> {
        let alice = AccountId::new_unchecked("alice.testnet".to_string());
        let bob = AccountId::new_unchecked("bob.testnet".to_string());

        vec![
            Blessing {
                price: 100_000_000_000_000_000_000_000,
                owner_id: alice,
                deleted: 0,
                tax_rate: 10,
            },
            Blessing {
                price: 100_000_000_000_000_000_000_000,
                owner_id: bob,
                deleted: 0,
                tax_rate: 20,
            },
        ]
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

        let my_blessings = contract.my_sended_blessings(alice.clone());

        log!("My blessings: {:?}", my_blessings);

        // Add blessings
        let blessings = get_blessings();
        // contract.new_blessings(Base64VecU8("ewogICAgImltYWdlcyI6IFsKICAgICAgICAibGF6eV9sb3ZlLmdpZiIsCiAgICAgICAgImdvZGRlc3NfYmxlc3NpbmcuZ2lmIiwKICAgICAgICAiSV9hZG9yZV95b3UuZ2lmIiwKICAgICAgICAiMTJfbG92ZS5naWYiLAogICAgICAgICJtaXJhYmlsaXNfbGFkeS5naWYiLAogICAgICAgICJZT1UrTUUuZ2lmIgogICAgXSwKICAgICJibGVzc2luZ3MiOiBbCiAgICAgICAgewogICAgICAgICAgICAicHJpY2UiOiAiMTAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwIiwKICAgICAgICAgICAgIm93bmVyX2lkIjogImNyeXB0b19ibGVzc2luZ185NTI3LnRlc3RuZXQiLAogICAgICAgICAgICAiZGVsZXRlZCI6IDAsCiAgICAgICAgICAgICJ0YXhfcmF0ZSI6IDEwCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAgICJwcmljZSI6ICI1MDAwMDAwMDAwMDAwMDAwMDAwMDAwMCIsCiAgICAgICAgICAgICJvd25lcl9pZCI6ICJjcnlwdG9fYmxlc3NpbmdfOTUyNy50ZXN0bmV0IiwKICAgICAgICAgICAgImRlbGV0ZWQiOiAwLAogICAgICAgICAgICAidGF4X3JhdGUiOiAxMAogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgICAicHJpY2UiOiAiNTAwMDAwMDAwMDAwMDAwMDAwMDAwMDAiLAogICAgICAgICAgICAib3duZXJfaWQiOiAiY3J5cHRvX2JsZXNzaW5nXzk1MjcudGVzdG5ldCIsCiAgICAgICAgICAgICJkZWxldGVkIjogMCwKICAgICAgICAgICAgInRheF9yYXRlIjogMTAKICAgICAgICB9LAogICAgICAgIHsKICAgICAgICAgICAgInByaWNlIjogIjUwMDAwMDAwMDAwMDAwMDAwMDAwMDAwIiwKICAgICAgICAgICAgIm93bmVyX2lkIjogImNyeXB0b19ibGVzc2luZ185NTI3LnRlc3RuZXQiLAogICAgICAgICAgICAiZGVsZXRlZCI6IDAsCiAgICAgICAgICAgICJ0YXhfcmF0ZSI6IDEwCiAgICAgICAgfSwKICAgICAgICB7CiAgICAgICAgICAgICJwcmljZSI6ICI1MDAwMDAwMDAwMDAwMDAwMDAwMDAwMCIsCiAgICAgICAgICAgICJvd25lcl9pZCI6ICJjcnlwdG9fYmxlc3NpbmdfOTUyNy50ZXN0bmV0IiwKICAgICAgICAgICAgImRlbGV0ZWQiOiAwLAogICAgICAgICAgICAidGF4X3JhdGUiOiAxMAogICAgICAgIH0sCiAgICAgICAgewogICAgICAgICAgICAicHJpY2UiOiAiMTAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwIiwKICAgICAgICAgICAgIm93bmVyX2lkIjogImNyeXB0b19ibGVzc2luZ185NTI3LnRlc3RuZXQiLAogICAgICAgICAgICAiZGVsZXRlZCI6IDAsCiAgICAgICAgICAgICJ0YXhfcmF0ZSI6IDEwCiAgICAgICAgfQogICAgXQp9".as_bytes().to_vec()));
        contract.new_blessing("image1.gif".to_string(), 100_000_000_000_000_000_000_000, 10, alice.clone());
        let blessing1 = contract.blessing_map.get(&"image1.gif".to_string()).unwrap();
        assert_eq!(blessing1.price, 100_000_000_000_000_000_000_000);

        //gen random pubkey


        // start to send blessing
        // log!("env::account_balance: {:?}", env::account_balance());
        // contract.send_blessing("image1.gif".to_string(), "blessing_id".to_string(), 2, ClaimType::Random, vec!["123".to_string(), "456".to_string()]);
        
        let my_blessings2 = contract.my_sended_blessings(alice.clone());
        log!("My blessings: {:?}", my_blessings2);
    }

}
