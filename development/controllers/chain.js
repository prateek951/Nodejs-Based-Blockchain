/** Created by Prateek Madaan on 27 November 2018*/

const Blockchain = require("../blockchain");
const { OK } = require("http-status-codes");
const uuid = require("uuid/v1");

/** This NODE_ADDRESS MUST BE UNIQUE */

const NODE_ADDRESS = uuid()
  .split("-")
  .join("");
const bitcoin = new Blockchain();

exports.retrieveBlockchain = (req, res, next) => {
  console.log("hooked up...");
  res.status(OK).send(bitcoin);
};

exports.createTransaction = (req, res, next) => {
  /** Tap the amount, sender and the receiver from request body  */

  const { amount, sender, receiver } = req.body;

  const blockIndex = bitcoin.createNewTransaction(amount, sender, receiver);
  res
    .status(OK)
    .json({ message: `Transaction will be added in block ${blockIndex}` });
};

exports.mineBlock = (req, res, next) => {
  console.log("hooked up...");

  const { hash: previousBlockHash, index } = bitcoin.getLastBlock();
  const currentBlockData = {
    transactions: bitcoin.pendingTransactions,
    index: index + 1
  };
  const nonce = bitcoin.PROOF_OF_WORK(previousBlockHash, currentBlockData);
  const blockHash = bitcoin.hashBlock(
    previousBlockHash,
    currentBlockData,
    nonce
  );

  /**  Reward the miner with 12.5 BTC*/
  bitcoin.createNewTransaction(12.5, "00",NODE_ADDRESS);
  /** Now mine a new block */
  const newBlock = bitcoin.addBlock(nonce, previousBlockHash, blockHash);

  res
    .status(OK)
    .json({ message: "New Block Mined Successfully!", block: newBlock });
};
