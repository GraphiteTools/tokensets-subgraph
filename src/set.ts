import { Address } from "@graphprotocol/graph-ts"

import { Set, Issuance, Redemption, Rebalance } from "../generated/schema"
import { Transfer, RebalanceStarted, Set as SetContract }  from "../generated/SetCore/templates/Set/Set"

export function handleTransfer(event: Transfer): void {
	let id = event.transaction.hash.toHexString() + '-' + event.logIndex.toString();
	let from = event.params.from;
	let to  = event.params.to;
	let value = event.params.value;
	let zeroAddress = '0x0000000000000000000000000000000000000000';

	let setAddress = event.address;

	if (from.toHexString() == zeroAddress) {
		if (isTokenSet(setAddress)) {
			// Mint
			let issuance = new Issuance(id);
			issuance.set_ = setAddress.toHexString();
			issuance.amount = value;
			issuance.account = to;
			issuance.timestamp = event.block.timestamp;
			issuance.save();

			let setContract = SetContract.bind(setAddress);
			let set = Set.load(setAddress.toHexString());
			set.supply = setContract.totalSupply();
			set.save();
		}
	}
	if (to.toHexString() == zeroAddress) {
		if (isTokenSet(setAddress)) {
			// Burn
			let redemption = new Redemption(id);
			redemption.set_ = setAddress.toHexString();
			redemption.amount = value;
			redemption.account = from;
			redemption.timestamp = event.block.timestamp;
			redemption.save();

			let setContract = SetContract.bind(setAddress);
			let set = Set.load(setAddress.toHexString());
			set.supply = setContract.totalSupply();
			set.save();
		}
	}
}

export function handleRebalance(event: RebalanceStarted): void {
	let id = event.transaction.hash.toHexString() + '-' + event.logIndex.toString();
	let setAddress = event.address;

	if (isTokenSet(setAddress)) {
		let rebalance = new Rebalance(id);
		rebalance.set_ = setAddress.toHexString();
		rebalance.oldSet = event.params.oldSet;
		rebalance.newSet = event.params.newSet;
		rebalance.timestamp = event.block.timestamp;
		rebalance.save();

		let set = Set.load(setAddress.toHexString());
		set.components = [ rebalance.newSet ];
		set.save();
	}
}

function isTokenSet(address: Address): boolean {
	let set = Set.load(address.toHexString());
	return set != null;
}
