/** Created by Prateek Madaan on 27 November 2018*/

const Blockchain = require("../blockchain");
const { OK } = require("http-status-codes");
const uuid = require("uuid/v1");
const RP = require("request-promise");

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
  bitcoin.createNewTransaction(12.5, "00", NODE_ADDRESS);
  /** Now mine a new block */
  const newBlock = bitcoin.addBlock(nonce, previousBlockHash, blockHash);

  res
    .status(OK)
    .json({ message: "New Block Mined Successfully!", block: newBlock });
};

exports.registerAndBroadcast = (req, res, next) => {
  const { NEW_NODE_URL } = req.body;
  /** Register the new node with the network nodes if it does not exist already
   * in the network
   */
  if (bitcoin.NETWORK_NODES.indexOf(NEW_NODE_URL) <= -1)
    bitcoin.NETWORK_NODES.push(NEW_NODE_URL);

  const registerNodePromises = [];

  bitcoin.NETWORK_NODES.forEach(NETWORK_NODE_URL => {
    /** Hit the /register-node */
    const options = {
      uri: `${NETWORK_NODE_URL}/register-node`,
      method: "POST",
      body: {
        NEW_NODE_URL: NEW_NODE_URL
      },
      json: true
    };
    registerNodePromises.push(RP(options));
  });
  Promise.all(registerNodePromises)
    .then(data => {
      const bulkRegisterOptions = {
        uri: `${NEW_NODE_URL}/register-nodes-bulk`,
        method: "POST",
        body: {
          allNetworkNodes: [...bitcoin.NETWORK_NODES, bitcoin.CURRENT_NODE_URL]
        },
        json: true
      };
      return RP(bulkRegisterOptions);
    })
    .then(data => {
      res.status(OK).json({
        message: "New node registered with the network successfully!"
      });
    });
};

exports.registerNode = (req, res, next) => {
  const { NEW_NODE_URL } = req.body;
  /**
   * Check for the existence of the NEW_NODE_URL
   */

  const nodeNotExists = bitcoin.NETWORK_NODES.indexOf(NEW_NODE_URL) <= -1;
  /**
   * Register node on the current node keeping in mind
   * that the current node url should not match with the new
   * node url
   */
  const notCurrentNode = bitcoin.CURRENT_NODE_URL !== NEW_NODE_URL;
  /** If the NEW_NODE_URL does not exists in the NETWORK_NODES
   * array, then add it to the NETWORK_NODES array */

  if (nodeNotExists && notCurrentNode) bitcoin.NETWORK_NODES.push(NEW_NODE_URL);
  res.status(OK).json({
    message: "New node registered successfully"
  });
};

exports.registerMultipleNodes = (req, res, next) => {
  const { allNetworkNodes } = req.body;
  allNetworkNodes.forEach(NETWORK_NODE_URL => {
    const nodeNotAlreadyPresent =
      bitcoin.NETWORK_NODES.indexOf(NETWORK_NODE_URL) <= -1;
    const notCurrentNode = bitcoin.CURRENT_NODE_URL !== NETWORK_NODE_URL;
    if (nodeNotAlreadyPresent && notCurrentNode)
      bitcoin.NETWORK_NODES.push(NETWORK_NODE_URL);
  });
  res.status(OK).json({
    message: "Bulk registration successful"
  });
};
