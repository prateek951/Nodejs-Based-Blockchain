/** Created by Prateek Madaan on 27 November 2018*/
/** Modified by Prateek Madaan on 8 December 2018*/

const Blockchain = require("../blockchain");
const { OK, INTERNAL_SERVER_ERROR } = require("http-status-codes");
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

// exports.createTransaction = (req, res, next) => {
//   const newTransaction = req.body;
//   const blockIndex = bitcoin.addTransactionToPendingTransactions(
//     newTransaction
//   );
//   res.status(OK).json({
//     message: `Transaction will be added in the block ${blockIndex}`
//   });
// };

// exports.createAndBroadcastTransaction = (req, res, next) => {
//   /** Tap the amount, sender and the receiver from request body  */

//   const { amount, sender, receiver } = req.body;

//   /** Create a new transaction */

//   const newTransaction = bitcoin.createNewTransaction(amount, sender, receiver);

//   /** On this node, add the newTransaction to the pending transactions */
//   bitcoin.addTransactionToPendingTransactions(newTransaction);

//   const requestPromises = [];

//   /** Broadcast the transaction to all the network nodes */
//   bitcoin.NETWORK_NODES.forEach(NETWORK_NODE_URL => {
//     /** Hit the /register-node */
//     const options = {
//       uri: `${NETWORK_NODE_URL}/transaction`,
//       method: "POST",
//       body: newTransaction,
//       json: true
//     };
//     requestPromises.push(RP(options));
//   });
//   Promise.all(requestPromises).then(data => {
//     res.status(OK).json({
//       message: `Transaction created and broadcasted with success`
//     });
//   });
// };

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

  /** Now mine a new block */
  const newBlock = bitcoin.addBlock(nonce, previousBlockHash, blockHash);
  const requestPromises = [];
  /** Broadcast the newBlock to all other nodes in the network */

  bitcoin.NETWORK_NODES.forEach(NETWORK_NODE_URL => {
    const options = {
      uri: `${NETWORK_NODE_URL}/receive-new-block`,
      method: "POST",
      body: { newBlock },
      json: true
    };
    requestPromises.push(RP(options));
  });
  Promise.all(requestPromises)
    .then(data => {
      const options = {
        uri: `${bitcoin.CURRENT_NODE_URL}/transaction/broadcast`,
        method: "POST",
        body: {
          amount: 12.5,
          sender: "00",
          receiver: NODE_ADDRESS
        },
        json: true
      };
      return RP(options);
    })
    .then(data => {
      res.status(OK).json({
        message: "New block mined & broadcasted with success",
        block: newBlock
      });
    });
};


exports.receiveNewBlock = (req, res, next) => {
  const { newBlock:block } = req.body;
  const lastBlock = bitcoin.getLastBlock();
  /** Check for the validity of the incoming block */ 
  const isValid = lastBlock.hash === block.previousBlockHash;
  /** Check whether the newBlock is immediately next to the last block */ 
  const isNext = lastBlock['index'] + 1 === block['index'];
  if(isValid && isNext) {
    /** New block is legitimate */ 
    bitcoin.chain.push(block);
    /** Clear the pending transactions */
    bitcoin.pendingTransactions = [];
    res.status(OK).json({
      message : `New Block received and accepted`,
      newBlock : block
    }); 
  } else {
    res.status(INTERNAL_SERVER_ERROR)
      .json({
        message : `New block rejected`,
        newBlock : block
      }); 
  }
}

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
