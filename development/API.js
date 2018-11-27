/** Created by Prateek Madaan on 27 November 2018*/

const express = require("express");
const app = express();
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
 * @route GET /mine
 * @desc Mine a new block (Create a new block)
 * @access Public
 */
app.get("/mine", blockchainController.mineBlock);

const { PORT } = process.env;
const port = PORT || 3000;
app.listen(port, () => console.log(`server spinning on ${port}`));
