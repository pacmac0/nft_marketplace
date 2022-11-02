This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started
```bash
yarn create next-app .
```
First, run the development server:
```bash
yarn dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

This is going to be our frontend with TheGraph for event indexing functinality for the NFT-Marketplace.
The frontend code is going to be very similar if not the same.

The Graph specific steps
1. Connect wallet to [The Graph Studio](https://thegraph.com/studio/)
2. Create Subgraph on Goerli Testnet "my_nft_marketplace"
3. Install The Graph CLI globally
```bash 
yarn global add @graphprotocol/graph-cli
```
4. Create separate repositroy for subgraph, here we will just put everything related to the subgraph in the folder subgraph.
5. Init subgraph
   1. For this we need the contract address of our Marketplace contract on the testnet! Or any other contract that should be inexed.
   2. So make sure you deployed the contracts to the respective network eg. Goerli. This might take a while.
      1. Add Goerli network to hardhat.config.ts with alchemy RPC URL and the mapping to helper-hardhat-config.ts
      2. Deploying with the frontend update deploy function should give us the contract addresses in the constants folder.
      3. => Verification of NFT contract failed rerun from console with: 
            ```bash 
            yarn hardhat verify --network goerli 0xE71AF3d05dc3A0c5c6b7fc9E00aC188647EE8De8 --contract contracts/mock/MockNft.sol:MockNft
            ```
      4. __Contract addresses__ on Goerli
         - NftMarketplace: 0x2235Fb0600400f392fbba65b08b1E7bA2fCEf663
         - MockNft: 0xE71AF3d05dc3A0c5c6b7fc9E00aC188647EE8De8


    3. init subgraph
        ```bash 
        graph init --studio my_nft_marketplace
        ```
    4. Create schema in schema.graphql 
       1. With the following you can generate the code from the schema to the generated folder
            ```bash 
            graph codegen
            ```
    5. define handlers in src.nft-marketplace.ts and
    6. add the start-block, where the contract was deployed minus 1, to subgraph.yaml. This prevents indexing from beginning of time but instead starts at contract creation. 
    7. Add auth token to studio
        ```bash 
        graph codegen && graph build
        ```
    8. Deploy to the graph network
        ```bash 
        graph deploy --studio my_nft_marketplace
        ```
   


#### Features
1. Homepage with connect wallet option
2. Show listed Nft's
3. make them purchaseable
4. If you own it you can update the listing