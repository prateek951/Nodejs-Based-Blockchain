/** Created by Prateek Madaan on 27 November 2018*/

const express = require("express");
const app = express();
const port = process.argv[2];
const blockchainController = require("./controllers/chain");

/** Parsing incoming request body */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/**
 * @route GET /blockchain
 * @desc Retrieve the blockchain
 * @access Public
 */

app.get("/blockchain", blockchainController.retrieveBlockchain);

/**
 * @route POST /transaction
 * @desc Create a new transaction on our blockchain
 * @access Public
 */

app.post("/transaction", blockchainController.createTransaction);

/**
 * @route POST /transaction
 * @desc Not just create a new transaction but also broadcast
 * that transaction to all other nodes in the network
 * @access Public
 *
 */
app.post(
  "/transaction/broadcast",
  blockchainController.createAndBroadcastTransaction
);
/**
 * @route GET /mine
 * @desc Mine a new block (Create a new block)
 * @access Public
 */
app.get("/mine", blockchainController.mineBlock);

/**
 * @route POST /register-and-broadcast-node
 * @desc Register a node and broadcast it
 * @access Public
 */

app.post(
  "/register-and-broadcast-node",
  blockchainController.registerAndBroadcast
);

/**
 * @route POST /register-node
 * @desc Register the new node with the network that was broadcasted
 * @access Public
 */

app.post("/register-node", blockchainController.registerNode);

/**
 * @route POST /register-nodes-bulk
 * @desc Register multiple nodes at once
 * @access Public
 */

app.post("/register-nodes-bulk", blockchainController.registerMultipleNodes);

app.listen(port, () => console.log(`server spinning on ${port}`));
