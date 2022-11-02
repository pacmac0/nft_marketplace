import { DeployFunction } from "hardhat-deploy/dist/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { developmentChains, VERIFICATION_BLOCK_CONFIRMATIONS } from "../helper-hardhat-config"
import verify from "../utils/verify"

const deployNftMarketplace: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const { deployments, network, getNamedAccounts, ethers } = hre
	const { deploy, log } = deployments
	const { deployer } = await getNamedAccounts()
	const waitBlockConfirmations = developmentChains.includes(network.name)
		? 1
		: VERIFICATION_BLOCK_CONFIRMATIONS

	log("___________________________________________________")
	const args: any[] = []
	const marketplace = await deploy("NftMarketplace", {
		from: deployer,
		args: args,
		log: true,
		waitConfirmations: waitBlockConfirmations,
	})

	if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
		log("Verifying...")
		await verify(marketplace.address, args)
	}
	log("___________________________________________________")
}

export default deployNftMarketplace
deployNftMarketplace.tags = ["all", "nftmarketplace"]
