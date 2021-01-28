const express = require('express');
const bodyParser = require('body-parser');
const BLcoin = require('./BLcoin.js');
const { v4: uuidv4 } = require('uuid');
const port = process.argv[2];  // 3000;
const app = express();
const nodeAddress = uuidv4().split('-').join('');
const coin = new BLcoin();
const rp = require('request-promise');

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}));

app.get('/', function (req, res) {
  res.json({"node": nodeAddress});
});

app.get('/blockchain', function (req, res) {
  res.send(coin);
});

app.post('/transaction', function(req, res) {
  const newTransaction = req.body;
  const blockIndex = coin.addPendingTransaction(newTransaction);
  res.json({ note: `Transaction will be added in block ${blockIndex}.` });
});

// app.post('/transaction', function (req, res) {
//   const newTransaction = coin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
//   res.json({
//     note: `Sending ${req.body.amount} BLcoins `,
//     transaction: newTransaction
//   });
//
//   // const newTransaction = req.body;
//   // const blockIndex = coin.addPendingTransaction(newTransaction);
//   // res.json({ note: `Sending ${req.body.amount} BLcoins `,
//   //     transaction: newTransaction
//   // });
// });

app.post('/transaction/broadcast', function (req, res) {
  const newTransaction = coin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
  coin.addPendingTransaction(newTransaction);
  const requestPromises = [];
  coin.networkNodes.forEach(networkNodeUrl => {
    // broadcasting
    const requestOptions = {
      uri: networkNodeUrl + '/transaction',
      method: 'POST',
      body: newTransaction,
      json: true
    };
    requestPromises.push(rp(requestOptions));
  });
  Promise.all(requestPromises)
    .then(data => {
      res.JSON({ note: 'Transaction broadcast successfully across nodes.' })
    });
});

app.get('/mine', function (req, res) {
  const lastBlock = coin.getLastBlock();
  const previousBlockHash = lastBlock['hash'];
  const currentBlockData = {
    transactions: coin.pendingTransactions,
    index: lastBlock['index'] + 1
  };
  const nonce = coin.proofOfWork(previousBlockHash, currentBlockData);
  const blockHash = coin.hashBlock(previousBlockHash, currentBlockData, nonce);
  const newBlock = coin.createNewBlock(nonce, previousBlockHash, blockHash);
  const requestPromises = [];
  coin.networkNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      uri: networkNodeUrl + '/receive-new-block',
      method: 'POST',
      body: { newBlock: newBlock },
      json: true
    };
    requestPromises.push((requestOptions));
  });

  Promise.all(requestPromises)
    .then(data => {
      const requestOptions = {
        uri: coin.currentNodeUrl + '/transaction/broadcast',
        method: 'POST',
        body: {
          amount: 12.5,
          sender: "00",
          recipient: nodeAddress
        },
        json: true
      };
      return rp(requestOptions);
    })
    .then(data => {
      res.json({
        note: 'New block mined & broadcast successfully.',
        block: newBlock
      });
    })
});

app.post('/receive-new-block', function (req, res) {
  const newBlock = req.body.newBlock;
  const lastBlock = coin.getLastBlock();
  const correctHash = lastBlock.hash === newBlock.previousBlockHash;
  const correctIndex = lastBlock['index'] + 1 === newBlock['index'];
  if (correctHash && correctIndex) {
    coin.chain.push(newBlock);
    coin.pendingTransactions = [];
    res.json({ note: 'New block received and accepted.', newBlock: newBlock });
  } else {
    res.json({ note: 'New block rejected.', newBlock: newBlock })
  }
});

app.post('/register-and-broadcast-node', function (req, res) {
  const newNodeUrl = req.body.newNodeUrl;
  if (coin.networkNodes.indexOf(newNodeUrl) === -1) coin.networkNodes.push(newNodeUrl);
  const registerNodesPromises = [];
  coin.networkNodes.forEach(networkNodeUrl => {
    // register-node
    const requestOptions = {
      uri: networkNodeUrl + '/register-node',
      method: 'POST',
      body: {
        newNodeUrl: newNodeUrl
      },
      json: true
    };

    registerNodesPromises.push(rp(requestOptions));
  });

  Promise.all(registerNodesPromises)
    .then(data => {
      const bulkRegisterOpts = {
        uri: newNodeUrl + '/register-nodes-bulk',
        method: 'POST',
        body: {
          allNetworkNodes: [...coin.networkNodes, coin.currentNodeUrl],
        },
        json: true
      };

      return rp(bulkRegisterOpts);
    })
    .then(data => {
      res.json({note: 'New node registered successfully.'})
    });
});

app.post('/register-node', function (req, res) {
  const newNodeUrl = req.body.newNodeUrl;
  const notAlreadyPresent = coin.networkNodes.indexOf(newNodeUrl) === -1;
  const notCurrentNode = coin.currentNodeUrl !== newNodeUrl;
  if (notAlreadyPresent && notCurrentNode) coin.networkNodes.push(newNodeUrl);
  res.json({note: 'New node registered successfully.'});
});

app.post('/register-nodes-bulk', function (req, res) {
  const allNetworkNodes = req.body.allNetworkNodes;
  allNetworkNodes.forEach(networkNodeUrl => {
    const noodeNtAlreadyPresent = coin.networkNodes.indexOf(networkNodeUrl) === -1;
    const notCurrentNode = coin.currentNodeUrl !== networkNodeUrl;
    if (noodeNtAlreadyPresent && notCurrentNode) coin.networkNodes.push(networkNodeUrl);
  });
  res.json({note: 'Bulk node registration successful.'});
});

app.get('/consensus', function (req, res) {
  const requestPromises = [];
  coin.networkNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      uri: networkNodeUrl + '/blockchain',
      method: 'GET',
      json: true
    };

    requestPromises.push(rp(requestOptions));
  });

  Promise.all(requestPromises)
    .then(blockchains => {
      const currentChainLength = coin.chain.length;
      let maxChainLength = currentChainLength;
      let newLongestChain = null;
      let newPendingTransactions = null;

      blockchains.forEach(blockchain => {
        if (blockchain.chain.length > maxChainLength) {
          maxChainLength = blockchain.chain.length;
          newLongestChain = blockchain.chain;
          newPendingTransactions = blockchain.pendingTransactions;
        };
      });

      if (!newLongestChain || (newLongestChain && !coin.chainIsValid(newLongestChain))) {
        res.json({
          note: 'Current chain has not been replaced.',
          chain: coin.chain
        });
      }
      else {
        coin.chain = newLongestChain;
        coin.pendingTransactions = newPendingTransactions;
        res.json({
          note: 'This chain has been replaced.',
          chain: coin.chain
        });
      }
    });
});

app.get('/block/:blockHash', function (req, res) {
  const blockHash = req.params.blockHash;
  const correctBlock = coin.getBlock(blockHash);
  res.json({
    block: correctBlock
  });
});

app.get('/transaction/:transactionId', function (req, res) {
  const transactionId = req.params.transactionId;
  const transactionData = coin.getTransaction(transactionId);
  res.json({
    transaction: transactionData.transaction,
    block: transactionData.block
  });
});

app.get('/address/:address', function (req, res) {
  const address = req.params.address;
  const addressData = coin.getAddressData(address);
  res.json({
    addressData: addressData
  })
});


app.listen(port, function () {
  console.log(`[+] Node address: ${nodeAddress} \n[+] Listening on port: ${port}...`);
});
