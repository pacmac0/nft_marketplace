import { network, deployments, ethers } from "hardhat"
import { developmentChains } from "../../helper-hardhat-config"
import { assert, expect } from "chai"
import { Signer } from "ethers"
import { NftMarketplace, MockNft } from "../../typechain-types"
// import { MockNft } from "../../typechain-types/contracts/mocks"

!developmentChains.includes(network.name)
	? describe.skip
	: describe("Nft Marketplace Unit Tests", function () {
			// vars
			let nftMarketplaceContract: NftMarketplace,
				nftMarketplace: NftMarketplace,
				mockNft: MockNft
			const TOKENID: number = 0
			let deployer: Signer, user: Signer

			// before each
			beforeEach(async () => {
				const accounts = await ethers.getSigners()
				deployer = accounts[0]
				user = accounts[1]
				await deployments.fixture(["nftmarketplace", "mocknft"])
				nftMarketplaceContract = await ethers.getContract("NftMarketplace")
				nftMarketplace = nftMarketplaceContract.connect(deployer)
				mockNft = await ethers.getContract("MockNft", deployer)
				await mockNft.mintNft() // wait() ??
				await mockNft.approve(nftMarketplaceContract.address, TOKENID)
			})
			// describes sets
			describe("listNft", function () {
				it("reverts if user isn't NFT owner", async () => {
					nftMarketplace = nftMarketplaceContract.connect(user)
					// await mockNft.approve(await user.getAddress(), TOKENID)
					await expect(
						nftMarketplace.listNft(
							mockNft.address,
							TOKENID,
							ethers.utils.parseEther("1")
						)
					).to.be.revertedWith("NftMarketplace__NotOwner")
				})
				it("reverts if NFT is already listed", async () => {
					await nftMarketplace.listNft(
						mockNft.address,
						TOKENID,
						ethers.utils.parseEther("1")
					)
					await expect(
						nftMarketplace.listNft(
							mockNft.address,
							TOKENID,
							ethers.utils.parseEther("1")
						)
					).to.be.revertedWith(`AlreadyListed("${mockNft.address}", ${TOKENID})`)
				})
				it("reverts if price is <= 0", async () => {
					await expect(
						nftMarketplace.listNft(
							mockNft.address,
							TOKENID,
							ethers.utils.parseEther("0")
						)
					).to.be.revertedWith("NftMarketplace__PriceMustBeAboveZero")
				})
				it("reverts if contract isn't approved to spend NFT", async () => {
					// unaprove by aproving zero address
					mockNft.approve(ethers.constants.AddressZero, TOKENID)
					await expect(
						nftMarketplace.listNft(
							mockNft.address,
							TOKENID,
							ethers.utils.parseEther("1")
						)
					).to.be.revertedWith(
						`NftMarketplace__NotApprovedForMarketplace("${mockNft.address}", ${TOKENID})`
					)
				})
				it("Adds listing to contracts mapping", async () => {
					await nftMarketplace.listNft(
						mockNft.address,
						TOKENID,
						ethers.utils.parseEther("1")
					)
					const listing = await nftMarketplace.getListing(mockNft.address, TOKENID)

					assert(listing.seller.toString() == (await deployer.getAddress().toString()))
					assert(listing.price.toString() == ethers.utils.parseEther("1").toString())
				})
				it("emits listing-event", async () => {
					expect(
						await nftMarketplace.listNft(
							mockNft.address,
							TOKENID,
							ethers.utils.parseEther("1")
						)
					).to.emit(nftMarketplace, "NftListed")
				})
			})
			describe("cancelListing", function () {
				it("reverts if not called by owner", async () => {
					await nftMarketplace.listNft(
						mockNft.address,
						TOKENID,
						ethers.utils.parseEther("1")
					)
					nftMarketplace = nftMarketplaceContract.connect(user)
					await expect(
						nftMarketplace.cancelListing(mockNft.address, TOKENID)
					).to.be.revertedWith("NftMarketplace__NotOwner")
				})
				it("reverts if NFT is not listed", async () => {
					await expect(
						nftMarketplace.cancelListing(mockNft.address, TOKENID)
					).to.be.revertedWith(
						`NftMarketplace__NotListed("${mockNft.address}", ${TOKENID})`
					)
				})
				it("removes listing from the mapping and emits listing cancled event", async () => {
					await nftMarketplace.listNft(
						mockNft.address,
						TOKENID,
						ethers.utils.parseEther("1")
					)
					await expect(nftMarketplace.cancelListing(mockNft.address, TOKENID)).to.emit(
						nftMarketplace,
						"ListingCanceled"
					)
					const listing = await nftMarketplace.getListing(mockNft.address, TOKENID)
					assert(listing.price.toString() == "0")
				})
			})
			describe("updateListingPrice", function () {
				beforeEach(async () => {
					await nftMarketplace.listNft(
						mockNft.address,
						TOKENID,
						ethers.utils.parseEther("1")
					)
				})
				// jumping isOwner and isListedmodifiers here, since they have been tested above with other functions
				it("reverts if new price is <= 0", async () => {
					await expect(
						nftMarketplace.updateListingPrice(
							mockNft.address,
							TOKENID,
							ethers.utils.parseEther("0")
						)
					).to.be.revertedWith("NftMarketplace__PriceMustBeAboveZero")
				})
				it("updates listing price and emits update event", async () => {
					await expect(
						nftMarketplace.updateListingPrice(
							mockNft.address,
							TOKENID,
							ethers.utils.parseEther("2")
						)
					).to.emit(nftMarketplace, "ListingUpdated")
					const listing = await nftMarketplace.getListing(mockNft.address, TOKENID)
					assert(listing.price.toString() == ethers.utils.parseEther("2").toString())
				})
			})
			describe("buyNft", function () {
				beforeEach(async () => {
					await nftMarketplace.listNft(
						mockNft.address,
						TOKENID,
						ethers.utils.parseEther("1")
					)
					nftMarketplace = nftMarketplaceContract.connect(user)
				})
				it("reverts if price isn't met", async () => {
					await expect(
						nftMarketplace.buyNft(mockNft.address, TOKENID, {
							value: ethers.utils.parseEther("0.1"),
						})
					).to.be.revertedWith(
						`NftMarketplace__PriceNotMet("${mockNft.address}", ${TOKENID})`
					)
				})
				it("updates listing and proceeds, transfers NFT and emits bought event", async () => {
					await expect(
						nftMarketplace.buyNft(mockNft.address, TOKENID, {
							value: ethers.utils.parseEther("1"),
						})
					).to.emit(nftMarketplace, "NftBought")
					const listing = await nftMarketplace.getListing(mockNft.address, TOKENID)
					const newOwner = await mockNft.ownerOf(TOKENID)
					const proceeds = await nftMarketplace.getProceeds(deployer.getAddress())
					assert(listing.price.toString() == "0")
					assert(newOwner.toString() == (await user.getAddress()))
					assert(proceeds.toString() == ethers.utils.parseEther("1"))
				})
			})
			describe("withdrawProceeds", function () {
				beforeEach(async () => {
					await nftMarketplace.listNft(
						mockNft.address,
						TOKENID,
						ethers.utils.parseEther("1")
					)
					nftMarketplace = nftMarketplaceContract.connect(user)
				})
				it("reverts if no proceeds are available", async () => {
					await expect(nftMarketplace.withdrawProceeds()).to.be.revertedWith(
						"NftMarketplace__NoProceeds"
					)
				})
				it("updates proceeds mapping and sends funds", async () => {
					await nftMarketplace.buyNft(mockNft.address, TOKENID, {
						value: ethers.utils.parseEther("1"),
					})
					nftMarketplace = nftMarketplaceContract.connect(deployer)
					const sellerBalanceBefore = await deployer.getBalance()
					const withdrawTxResponse = await nftMarketplace.withdrawProceeds()
					const withdrawTxReceipt = await withdrawTxResponse.wait(1)
					const gasCost =
						BigInt(withdrawTxReceipt.cumulativeGasUsed) *
						BigInt(withdrawTxReceipt.effectiveGasPrice)
					const sellerBalanceAfter = await deployer.getBalance()
					assert(
						sellerBalanceBefore
							.sub(gasCost)
							.add(ethers.utils.parseEther("1"))
							.toString() == sellerBalanceAfter.toString()
					)
				})
			})
	  })
