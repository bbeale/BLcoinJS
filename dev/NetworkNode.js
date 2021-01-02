const express = require('express');
const bodyParser = require('body-parser');
const blCoin = require('./BLcoin.js');
const { v4: uuidv4 } = require('uuid');
const port = process.argv[2];  // 3000;
const app = express();
const nodeAddress = uuidv4().split('-').join('');
const blcoin = new blCoin();
const rp = require('request-promise');

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}));

app.get('/', function (req, res) {
  res.json({"node": nodeAddress});
});

app.get('/blockchain', function (req, res) {
  res.send(blcoin);
});

app.post('/transaction', function (req, res) {
  const newTransaction = blcoin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
  res.json({
    note: `Sending ${req.body.amount} BLcoins `,
    transaction: newTransaction
  });

  // const newTransaction = req.body;
  // const blockIndex = blcoin.addPendingTransaction(newTransaction);
  // res.json({ note: `Sending ${req.body.amount} BLcoins `,
  //     transaction: newTransaction
  // });
});

app.get('/mine', function (req, res) {
  const lastBlock = blcoin.getLastBlock();
  const previousBlockHash = lastBlock['hash'];
  const currentBlockData = {
    transactions: blcoin.pendingTransactions,
    index: lastBlock['index'] + 1
  };
  const nonce = blcoin.proofOfWork(previousBlockHash, currentBlockData);
  const blockHash = blcoin.hashBlock(previousBlockHash, currentBlockData, nonce);
  blcoin.createNewTransaction(12.5, '00', nodeAddress);
  const newBlock = blcoin.createNewBlock(nonce, previousBlockHash, blockHash);
  res.json({
    note: 'New block mined successfully',
    block: newBlock
  });
});

app.post('/register-and-broadcast-node', function (req, res) {
  const newNodeUrl = req.body.newNodeUrl;
  if (blcoin.networkNodes.indexOf(newNodeUrl) == -1) blcoin.networkNodes.push(newNodeUrl);
  const registerNodesPromises = [];
  blcoin.networkNodes.forEach(networkNodeUrl => {
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
          allNetworkNodes: [...blcoin.networkNodes, blcoin.currentNodeUrl],
        },
        json: true
      };

      return rp(bulkRegisterOpts);
    })
    .then(data => {
      res.json({note: 'New node registered successfully'})
    });
});

app.post('/register-node', function (req, res) {
  const newNodeUrl = req.body.newNodeUrl;
  const notAlreadyPresent = blcoin.networkNodes.indexOf(newNodeUrl) == -1;
  const notCurrentNode = blcoin.currentNodeUrl !== newNodeUrl;
  if (notAlreadyPresent && notCurrentNode) blcoin.networkNodes.push(newNodeUrl);
  res.json({note: 'New node registered successfully.'});
});

app.post('/register-nodes-bulk', function (req, res) {
  const allNetworkNodes = req.body.allNetworkNodes;
  allNetworkNodes.forEach(networkNodeUrl => {
    const noodeNtAlreadyPresent = blcoin.networkNodes.indexOf(networkNodeUrl) == -1;
    const notCurrentNode = blcoin.currentNodeUrl !== networkNodeUrl;
    if (noodeNtAlreadyPresent && notCurrentNode) blcoin.networkNodes.push(networkNodeUrl);
  });
  res.json({note: 'Bulk node registration successful.'});
});

app.listen(port, function () {
  console.log(`[+] Node address: ${nodeAddress} \n[+] Listening on port: ${port}...`);
});
