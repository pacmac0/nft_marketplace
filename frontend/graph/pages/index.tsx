import type { NextPage } from "next"
import { useMoralis, useMoralisQuery } from "react-moralis"
import { useEffect, useState } from "react"
import NFTBox from "../components/NFTBox"
import GET_ACTIVE_ITEMS from "../constants/subGraphQueries"
import { useQuery } from "@apollo/client"
import networkMapping from "../constants/networkMapping.json"
const PAGE_SIZE = 9

const Home: NextPage = () => {
    // TODO: Implement paging in UI
    const [page, setPage] = useState(1)
    const { isWeb3Enabled, chainId } = useMoralis()
    const chainString = chainId ? parseInt(chainId).toString() : "31337"
    const valideNetworks = ["5"]
    const marketplaceAddress = networkMapping[chainString] ? networkMapping[chainString].NftMarketplace[0] : "0x0"
    const { loading, error, data: listedNfts } = useQuery(GET_ACTIVE_ITEMS)
    return (
        <div className="container mx-auto">
            <h1 className="py-4 px-4 font-bold text-2xl">Recently Listed</h1>
            <div className="flex flex-wrap">
                { !valideNetworks.includes(chainString) ?  
                    <div className="py-4 px-4 font-bold text-2xl">
                        Unsupported Network! Please switch to the Goerli-testnet.
                    </div>
                : (isWeb3Enabled ? (
                        loading || !listedNfts ? (
                            <div>Loading...</div>
                        ) : (
                            listedNfts.activeItems.map((nft) => {
                                // console.log(nft)
                                const { price, nftAddress, tokenId, marketplaceAddress, seller } = nft
                                return (
                                    <NFTBox
                                        price={price}
                                        nftAddress={nftAddress}
                                        tokenId={tokenId}
                                        marketplaceAddress={marketplaceAddress}
                                        seller={seller}
                                        key={`${nftAddress}${tokenId}`}
                                    />
                                )
                            })
                        )
                    ) : ( <div>Web3 Currently Not Enabled </div> )
                )}
            </div>
        </div>
    )
}
export default Home