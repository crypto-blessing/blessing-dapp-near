# blessing-dapp-near

Blessing is the most universal human expression of emotion, and we are NFTizing it.

## How it works

```bash
rustup target add wasm32-unknown-unknown


./build.sh

cargo test -- --nocapture

near delete crossword.quyang.testnet quyang.testnet
near create-account crossword.quyang.testnet --masterAccount quyang.testnet

near deploy crossword.quyang.testnet --wasmFile res/my_crossword.wasm \    
  --initFunction 'new' \
  --initArgs '{"solution": "69c2feb084439956193f4c21936025f14a5a5a78979d67ae34762e18a7206a0f"}'
```
