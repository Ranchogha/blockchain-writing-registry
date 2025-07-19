import { ProofRegistered } from "../generated/WritingRegistry/WritingRegistry";
import { Proof, Creator } from "../generated/schema";
import { BigInt } from "@graphprotocol/graph-ts";

export function handleProofRegistered(event: ProofRegistered): void {
  // Create or load the creator
  let creatorId = event.params.creator.toHex();
  let creator = Creator.load(creatorId);
  
  if (!creator) {
    creator = new Creator(creatorId);
    creator.address = creatorId;
    creator.proofCount = 0;
  }
  
  // Increment proof count
  creator.proofCount = creator.proofCount + 1;
  creator.save();

  // Create the proof entity
  let proofId = event.params.hash;
  let proof = new Proof(proofId);
  
  proof.hash = event.params.hash;
  proof.title = event.params.title;
  proof.license = event.params.license;
  proof.twitterHandle = event.params.twitterHandle;
  proof.timestamp = event.params.timestamp;
  proof.creator = creator.id;
  proof.blockNumber = event.block.number;
  proof.transactionHash = event.transaction.hash.toHex();
  
  proof.save();
} 