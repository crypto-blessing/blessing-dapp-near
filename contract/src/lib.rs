use near_sdk::collections::{LookupMap, UnorderedSet};
use near_sdk::{
    borsh::{self, BorshDeserialize, BorshSerialize},
    log,
    serde::{Deserialize, Serialize},
    AccountId, PanicOnDefault, Promise,
};
use near_sdk::{env, near_bindgen};


#[derive(BorshDeserialize, BorshSerialize, Deserialize, Serialize, Debug)]
#[serde(crate = "near_sdk::serde")]
pub struct Blessing {
    price: u128,
    owner_id: AccountId,
    deleted: u8,
    tax_rate: u16,
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct CryptoBlessing {
    owner_id: AccountId,
    blessing_map: LookupMap<String, Blessing>,
}

#[near_bindgen]
impl CryptoBlessing {

    #[init]
    pub fn new(owner_id: AccountId) -> Self {
        Self {
            owner_id,
            blessing_map: LookupMap::new(b"b"),
        }
    }

    pub fn new_blessings(&mut self, images: Vec<String>, blessings: Vec<Blessing>) {
        assert_eq!(
            env::predecessor_account_id(),
            self.owner_id,
            "Only the owner may call this method"
        );
        for(image, blessing) in images.iter().zip(blessings.iter()) {
            self.blessing_map.insert(&image.clone(), blessing.clone());
        }
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
    fn new_blessings_check() {
        // Get Alice as an account ID
        let alice = AccountId::new_unchecked("alice.testnet".to_string());
        // Set up the testing context and unit test environment
        let context = get_context(alice.clone());
        testing_env!(context.build());

        // Set up contract object and call the new method
        let mut contract = CryptoBlessing::new(alice);
        // Add puzzle
        let blessings = get_blessings();
        contract.new_blessings(
            vec!["image1.gif".to_string(), "image2.gif".to_string()],
            blessings,
        );
        let blessing1 = contract.blessing_map.get(&"image1.gif".to_string()).unwrap();
        assert_eq!(blessing1.price, 100_000_000_000_000_000_000_000);
    }

}
