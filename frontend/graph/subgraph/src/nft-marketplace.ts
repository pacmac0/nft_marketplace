import { BigInt, Address } from "@graphprotocol/graph-ts"
import {
	NftMarketplace,
	ListingCanceled as ListingCanceledEvent,
	ListingUpdated as ListingUpdatedEvent,
	NftBought as NftBoughtEvent,
	NftListed as NftListedEvent
} from "../generated/NftMarketplace/NftMarketplace"
import { ItemListed, ActiveItem, ItemBought, ItemCanceled } from "../generated/schema"

export function handleListingCanceled(event: ListingCanceledEvent): void {
	let itemCanceled = ItemCanceled.load(
		getIdFromEventParams(event.params.tokenId, event.params.nftAddress)
	)
	let activeItem = ActiveItem.load(
		getIdFromEventParams(event.params.tokenId, event.params.nftAddress)
	)
	if (!itemCanceled) {
		itemCanceled = new ItemCanceled(
			getIdFromEventParams(event.params.tokenId, event.params.nftAddress)
		)
	}
	itemCanceled.seller = event.params.sellers // typo recognized after deploy...
	itemCanceled.nftAddress = event.params.nftAddress
	itemCanceled.tokenId = event.params.tokenId
	activeItem!.buyer = Address.fromString("0x000000000000000000000000000000000000dEaD")

	itemCanceled.save()
	activeItem!.save()
}

export function handleListingUpdated(event: ListingUpdatedEvent): void {
	let itemListed = ItemListed.load(
		getIdFromEventParams(event.params.tokenId, event.params.nftAddress)
	)
	let activeItem = ActiveItem.load(
		getIdFromEventParams(event.params.tokenId, event.params.nftAddress)
	)
	if (!itemListed) {
		itemListed = new ItemListed(
			getIdFromEventParams(event.params.tokenId, event.params.nftAddress)
		)
	}
	if (!activeItem) {
		activeItem = new ActiveItem(
			getIdFromEventParams(event.params.tokenId, event.params.nftAddress)
		)
	}
	itemListed.seller = event.params.seller
	activeItem.seller = event.params.seller

	itemListed.nftAddress = event.params.nftAddress
	activeItem.nftAddress = event.params.nftAddress

	itemListed.tokenId = event.params.tokenId
	activeItem.tokenId = event.params.tokenId

	itemListed.price = event.params.price
	activeItem.price = event.params.price

	activeItem.buyer = Address.fromString("0x0000000000000000000000000000000000000000")

	itemListed.save()
	activeItem.save()
}

export function handleNftBought(event: NftBoughtEvent): void {
	let itemBought = ItemBought.load(
		getIdFromEventParams(event.params.tokenId, event.params.nftAddress)
	)
	let activeItem = ActiveItem.load(
		getIdFromEventParams(event.params.tokenId, event.params.nftAddress)
	)
	if (!itemBought) {
		itemBought = new ItemBought(
			getIdFromEventParams(event.params.tokenId, event.params.nftAddress)
		)
	}
	itemBought.buyer = event.params.buyer
	itemBought.nftAddress = event.params.nftAddress
	itemBought.tokenId = event.params.tokenId
	activeItem!.buyer = event.params.buyer

	itemBought.save()
	activeItem!.save()
}

export function handleNftListed(event: NftListedEvent): void {
	let itemListed = ItemListed.load(
		getIdFromEventParams(event.params.tokenId, event.params.nftAddress)
	)
	let activeItem = ActiveItem.load(
		getIdFromEventParams(event.params.tokenId, event.params.nftAddress)
	)
	if (!itemListed) {
		itemListed = new ItemListed(
			getIdFromEventParams(event.params.tokenId, event.params.nftAddress)
		)
	}
	if (!activeItem) {
		activeItem = new ActiveItem(
			getIdFromEventParams(event.params.tokenId, event.params.nftAddress)
		)
	}
	itemListed.seller = event.params.seller
	activeItem.seller = event.params.seller

	itemListed.nftAddress = event.params.nftAddress
	activeItem.nftAddress = event.params.nftAddress

	itemListed.tokenId = event.params.tokenId
	activeItem.tokenId = event.params.tokenId

	itemListed.price = event.params.price
	activeItem.price = event.params.price

	activeItem.buyer = Address.fromString("0x0000000000000000000000000000000000000000")

	itemListed.save()
	activeItem.save()
}

function getIdFromEventParams(tokenId: BigInt, nftAddress: Address): string {
	return tokenId.toHexString() + nftAddress.toHexString()
}
