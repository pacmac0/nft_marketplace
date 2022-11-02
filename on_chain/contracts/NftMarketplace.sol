// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

// imports
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// Check out https://github.com/Fantom-foundation/Artion-Contracts/blob/5c90d2bc0401af6fb5abf35b860b762b31dfee02/contracts/FantomMarketplace.sol
// For a full decentralized nft marketplace

// Errors
error NftMarketplace__NotOwner();
error NftMarketplace__AlreadyListed(address nftAddress, uint256 tokenId);
error NftMarketplace__PriceMustBeAboveZero();
error NftMarketplace__NotApprovedForMarketplace(address nftAddress, uint256 tokenId);
error NftMarketplace__NotListed(address nftAddress, uint256 tokenId);
error NftMarketplace__PriceNotMet(address nftAddress, uint256 tokenId);
error NftMarketplace__NoProceeds();

contract NftMarketplace is ReentrancyGuard {
	// Marketplace variables
	struct Listing {
		address seller;
		uint256 price;
	}
	// NftAddress->tokenId->listing
	mapping(address => mapping(uint256 => Listing)) private s_listings;
	mapping(address => uint256) private s_proceeds;

	// Events
	event NftListed(
		address indexed seller,
		address indexed nftAddress,
		uint256 indexed tokenId,
		uint256 price
	);
	event ListingCanceled(
		address indexed seller,
		address indexed nftAddress,
		uint256 indexed tokenId
	);
	event ListingUpdated(
		address indexed seller,
		address indexed nftAddress,
		uint256 indexed tokenId,
		uint256 price
	);
	event NftBought(
		address indexed buyer,
		address indexed nftAddress,
		uint256 indexed tokenId,
		uint256 price
	);

	modifier isOwner(
		address nftAddress,
		uint256 tokenId,
		address caller
	) {
		IERC721 nft = IERC721(nftAddress);
		address nftOwner = nft.ownerOf(tokenId);
		if (caller != nftOwner) {
			revert NftMarketplace__NotOwner();
		}
		_;
	}

	modifier notListed(address nftAddress, uint256 tokenId) {
		Listing memory listing = s_listings[nftAddress][tokenId];
		if (listing.price > 0) {
			revert NftMarketplace__AlreadyListed(nftAddress, tokenId);
		}
		_;
	}

	modifier isListed(address nftAddress, uint256 tokenId) {
		Listing memory listing = s_listings[nftAddress][tokenId];
		if (listing.price <= 0) {
			revert NftMarketplace__NotListed(nftAddress, tokenId);
		}
		_;
	}

	function listNft(
		address nftAddress,
		uint256 tokenId,
		uint256 price
	) external isOwner(nftAddress, tokenId, msg.sender) notListed(nftAddress, tokenId) {
		// checks:
		// 1. sender is token owner
		// 2. nft not listed yet
		// 3. price > 0
		// 4. contract is approved to sell NFT
		if (price <= 0) {
			revert NftMarketplace__PriceMustBeAboveZero();
		}
		IERC721 nft = IERC721(nftAddress);
		if (nft.getApproved(tokenId) != address(this)) {
			revert NftMarketplace__NotApprovedForMarketplace(nftAddress, tokenId);
		}
		// add to listings
		s_listings[nftAddress][tokenId] = Listing(msg.sender, price);
		// emit listing event
		emit NftListed(msg.sender, nftAddress, tokenId, price);
	}

	function cancelListing(address nftAddress, uint256 tokenId)
		external
		isOwner(nftAddress, tokenId, msg.sender)
		isListed(nftAddress, tokenId)
	{
		delete (s_listings[nftAddress][tokenId]);
		emit ListingCanceled(msg.sender, nftAddress, tokenId);
	}

	function updateListingPrice(
		address nftAddress,
		uint256 tokenId,
		uint256 price
	) external isOwner(nftAddress, tokenId, msg.sender) isListed(nftAddress, tokenId) nonReentrant {
		if (price <= 0) {
			revert NftMarketplace__PriceMustBeAboveZero();
		}
		s_listings[nftAddress][tokenId].price = price;
		emit ListingUpdated(msg.sender, nftAddress, tokenId, price);
	}

	// Always do all state updates before interacting with any other contract, especially in payable functions
	// it opens the risk of reentrant attacks
	function buyNft(address nftAddress, uint256 tokenId)
		external
		payable
		isListed(nftAddress, tokenId)
		nonReentrant
	{
		Listing memory listing = s_listings[nftAddress][tokenId];
		if (msg.value < listing.price) {
			revert NftMarketplace__PriceNotMet(nftAddress, tokenId);
		}
		// track sellers proceeds
		// Could just send the money... => https://fravoll.github.io/solidity-patterns/pull_over_push.html
		s_proceeds[listing.seller] += msg.value;
		// delete listing
		delete (s_listings[nftAddress][tokenId]);
		// transfer NFT
		IERC721(nftAddress).safeTransferFrom(listing.seller, msg.sender, tokenId);
		emit NftBought(msg.sender, nftAddress, tokenId, msg.value);
	}

	function withdrawProceeds() external {
		uint256 proceeds = s_proceeds[msg.sender];
		if (proceeds <= 0) {
			revert NftMarketplace__NoProceeds();
		}
		// update proceeds mapping
		s_proceeds[msg.sender] = 0;
		// send proceeds
		(bool success, ) = payable(msg.sender).call{value: proceeds}("");
		require(success, "Transfer failed");
	}

	/////////////////////
	// Getter Functions //
	/////////////////////

	function getListing(address nftAddress, uint256 tokenId)
		external
		view
		returns (Listing memory)
	{
		return s_listings[nftAddress][tokenId];
	}

	function getProceeds(address seller) external view returns (uint256) {
		return s_proceeds[seller];
	}
}
