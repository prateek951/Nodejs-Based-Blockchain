/** Created by Prateek Madaan on 27 November 2018 */
/** Modified on 8 December 2018 by Prateek Madaan */

/** Import the necessary third party packages */
const SHA256 = require("sha256");
const CURRENT_NODE_URL = process.argv[3];
const uuid = require("uuid/v1");

/** Constructor function for the Blockchain */
function Blockchain() {
  this.chain = [];
  this.pendingTransactions = [];
  this.CURRENT_NODE_URL = CURRENT_NODE_URL;
  this.NETWORK_NODES = [];
  /** Create the genesis block - pass in arbitrary params */
  this.addBlock(100, "0", "0");
}

/**
 * @desc Utility method to add a new block to the Blockchain
 * @param nonce
 * @param previousBlockHash The hash of the previous block
 * @param hash The hash of the current block
 * */

Blockchain.prototype.addBlock = function(nonce, previousBlockHash, hash) {
  /** Create a block */
  const newBlock = {
    index: this.chain.length + 1,
    timestamp: Date.now(),
    transactions: this.pendingTransactions,
    nonce,
    previousBlockHash,
    hash
  };
  /** Clear out the transactions since waiting transactions are now taken care of by new block*/

  this.pendingTransactions = [];

  /** Push the new block to the blockchain*/
  this.chain.push(newBlock);
  return newBlock;
};

/**
 * @desc Utility method to get the last block of the blockchain
 *
 * */

Blockchain.prototype.getLastBlock = function() {
  return this.chain[this.chain.length - 1];
};

/**
 * @desc Utility method to create a new transaction
 * @param amount to be transferred from the sender to the receiver
 * @param sender the sender address while still maintaining anonymity
 * @param receiver the recipient address while still maintain anonymity
 * */

Blockchain.prototype.createNewTransaction = function(amount, sender, receiver) {
  /** Create a new transaction */

  const newTransaction = {
    amount,
    sender,
    receiver,
    transactionId: uuid()
      .split("-")
      .join("")
  };
  return newTransaction;
};

/**
 * @desc Utility method to add created transaction to the pending transactions
 * @param transaction
 */

Blockchain.prototype.addTransactionToPendingTransactions = function(
  transaction
) {
  this.pendingTransactions.push(transaction);
  return this.getLastBlock()["index"] + 1;
};

/**
 * @desc Utility method to hash a block
 * @param previousBlockHash previousBlockHash for the current block
 * @param currentBlockData  The data of the current block which is to be hashed
 * @param nonce nonce
 */

Blockchain.prototype.hashBlock = function(
  previousBlockHash,
  currentBlockData,
  nonce
) {
  const blockString =
    previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
  const hash = SHA256(blockString, { asString: true });
  return hash;
};

/**
 * @desc Utility method to perform PROOF OF WORK (Computation Intensive)
 * @param previousBlockHash previousBlockHash for the current block
 * @param currentBlockData  The data of the current block which is to be hashed
 */

Blockchain.prototype.PROOF_OF_WORK = function(
  previousBlockHash,
  currentBlockData
) {
  /** POW*/

  /** Repeatedly hash the block until it finds the correct hash starting with say 0000*/
  /** Use the currentBlockData for the hash,but also the previousBlockHash */
  /** Continuously change nonce value until it finds the correct hash*/
  /** Return the nonce value that creates the correct hash */

  /** Define the nonce*/

  let nonce = 0;
  /** Hash for the first time */
  let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);

  /** Repeatedly hash the block until it finds the correct hash starting with say 0000*/
  while (hash.substring(0, 4) !== "0000") {
    /** Increment the nonce */

    nonce++;
    /** Again run the hashBlock method till the criteria is met*/
    hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    /** Constant monitor this log whether we got the hash with 4 0s at the start */

    console.log(hash);
  }
  /** Return the nonce */
  return nonce;
};

/**
 * @desc Utility method to check the validity of the blockchain
 * @param blockchain will take the blockchain and return whether
 * the chain is valid or not
 *
 */
Blockchain.prototype.isChainValid = function(blockchain) {
  /**
   * Iterate over the blockchain and for each block
   * check whether the current block's previous hash
   * matches with the previous block's hash.If so for
   * the entire blockchain the method will return true
   * otherwise the method returns false
   * */
  let valid = true;
  for (var i = 1; i < blockchain.length; i++) {
    const currentBlock = blockchain[i];
    const prevBlock = blockchain[i - 1];
    /** Rehash the block to see whether it starts with 4 zeroes*/
    const blockHash = this.hashBlock(
      prevBlock["hash"],
      {
        transactions: currentBlock["transactions"],
        index: currentBlock["index"]
      },
      currentBlock["nonce"]
    );
    if (blockHash.substring(0, 4) !== "0000") valid = false;
    if (currentBlock["previousBlockHash"] !== prevBlock["hash"]) valid = false;
    console.log("previousBlockHash =>", prevBlock["hash"]);
    console.log("currentBlockHash => ", currentBlock["hash"]);
  }
  const genesisBlock = blockchain[0];
  const hasCorrectNonce = genesisBlock["nonce"] === 100;
  const hasCorrectPreviousBlockHash = genesisBlock["previousBlockHash"] === "0";
  const hasCorrectHash = genesisBlock["hash"] === "0";
  const hasCorrectTransactions = genesisBlock["transactions"].length === 0;
  if (
    !hasCorrectNonce ||
    !hasCorrectPreviousBlockHash ||
    !hasCorrectHash ||
    !hasCorrectTransactions
  )
    valid = false;
  return valid;
};
/**
 * @desc Utility method to get a specific block of the blockchain by 
 * the blockHash 
 * @param blockHash the hash of the block
 *
 */
Blockchain.prototype.getBlock = function(blockHash) {
  let requiredBlock = null;
  this.chain.forEach(block => {
    if (block.hash === blockHash) requiredBlock = block;
  });
  return requiredBlock;
};

/**
 * @desc Utility method to get a specific transaction by its 
 * transactionId
 * @param transactionId   The id of the transaction
 *
 */

Blockchain.prototype.getTransactionById = function(transactionId) { 
  let requiredTransaction = null;
  let requiredBlock = null;
  this.chain.forEach(block => {
    block.transactions.forEach(transaction => {
      if(transaction.transactionId === transactionId) { 
          requiredTransaction = transaction;
          requiredBlock = block;
        }
    });
  })
  return {
    transaction : requiredTransaction,
    block : requiredBlock
  }
}


/** Export the blockchain for testing and other purposes */
module.exports = Blockchain;
