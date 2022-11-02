export interface networkConfigItem {
	name?: string
	subscriptionId?: string
	keepersUpdateInterval?: string
	raffleEntranceFee?: string
	callbackGasLimit?: string
	vrfCoordinatorV2?: string
	gasLane?: string
	ethUsdPriceFeed?: string
	mintFee?: string
}

export interface networkConfigInfo {
	[key: number]: networkConfigItem
}

export const networkConfig: networkConfigInfo = {
	31337: {
		name: "localhost",
	},
	5: {
		name: "goerli",
	},
	1: {
		name: "mainnet",
	},
}

export const developmentChains = ["hardhat", "localhost"]
export const VERIFICATION_BLOCK_CONFIRMATIONS = 6
export const frontEndContractsFile = "../frontend/moralis/constants/networkMapping.json"
export const frontEndContractsFile2 = "../frontend/graph/constants/networkMapping.json"
export const frontEndAbiLocation = "../frontend/moralis/constants/"
export const frontEndAbiLocation2 = "../frontend/graph/constants/"
