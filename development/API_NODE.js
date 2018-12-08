/** Created by Prateek Madaan on 27 November 2018*/

const express = require("express");
const app = express();
const port = process.argv[2];
const blockchainController = require("./controllers/chain");
const transactionRoutes = require('./routes/transactions');

/** Import the utils */
const { END_POINTS: endpoints } = require('./utils/endpoints');

/** Parsing incoming request body */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/**
 * @route GET /blockchain
 * @desc Retrieve the blockchain
 * @access Public
 */

app.get(endpoints.viewBlockchain, blockchainController.retrieveBlockchain);

/**
 * @route POST /transaction
 * @desc Create a new transaction on our blockchain
 * @access Public
 */

// app.post("/transaction", blockchainController.createTransaction);
app.use(endpoints.pertainingToTransaction,transactionRoutes);
/**
 * @route POST /transaction/broadcast
 * @desc Not just create a new transaction but also broadcast
 * that transaction to all other nodes in the network
 * @access Public
 *
 */
// app.post(
//   "/transaction/broadcast",
//   blockchainController.createAndBroadcastTransaction
// );
/**
 * @route GET /mine
 * @desc Mine a new block (Create a new block)
 * @access Public
 */
app.get(endpoints.mine, blockchainController.mineBlock);


/**
 * @route POST /receive-new-block
 * @desc Receive the new block that was broadcasted
 * @access Public
 */
app.post(endpoints.receiveNewBlock,blockchainController.receiveNewBlock);


/**
 * @route POST /register-and-broadcast-node
 * @desc Register a node and broadcast it
 * @access Public
 */

app.post(
  endpoints.registerAndBroadcast,
  blockchainController.registerAndBroadcast
);

/**
 * @route POST /register-node
 * @desc Register the new node with the network that was broadcasted
 * @access Public
 */

app.post(endpoints.registerNode, blockchainController.registerNode);

/**
 * @route POST /register-nodes-bulk
 * @desc Register multiple nodes at once
 * @access Public
 */

app.post(endpoints.registerNodeBulk, blockchainController.registerMultipleNodes);

app.listen(port, () => console.log(`server spinning on ${port}`));
