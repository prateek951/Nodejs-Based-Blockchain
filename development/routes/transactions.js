const express = require('express');

const Blockchain = require("../blockchain");
const { OK } = require("http-status-codes");
const RP = require("request-promise");
const bitcoin = new Blockchain();
const router = express.Router();


router.post('/', (req, res, next) => {
    const newTransaction = req.body;
    const blockIndex = bitcoin.addTransactionToPendingTransactions(
        newTransaction
    );
    res.status(OK).json({
        message: `Transaction will be added in the block ${blockIndex}`
    });
});

router.post('/broadcast', (req, res, next) => {
    /** Tap the amount, sender and the receiver from request body  */

    const { amount, sender, receiver } = req.body;

    /** Create a new transaction */

    const newTransaction = bitcoin.createNewTransaction(amount, sender, receiver);

    /** On this node, add the newTransaction to the pending transactions */
    bitcoin.addTransactionToPendingTransactions(newTransaction);

    const requestPromises = [];

    /** Broadcast the transaction to all the network nodes */
    bitcoin.NETWORK_NODES.forEach(NETWORK_NODE_URL => {
        /** Hit the /register-node */
        const options = {
            uri: `${NETWORK_NODE_URL}/transaction`,
            method: "POST",
            body: newTransaction,
            json: true
        };
        requestPromises.push(RP(options));
    });
    Promise.all(requestPromises).then(data => {
        res.status(OK).json({
            message: `Transaction created and broadcasted with success`
        });
    });
});

module.exports = router;