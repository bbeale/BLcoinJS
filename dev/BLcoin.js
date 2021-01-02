const SHA256 = require('sha256');
const currentNodeUrl = process.argv[3];

function BLcoin () {
  this.chain = [];
  this.pendingTransactions = [];
  this.currentNodeUrl = currentNodeUrl;
  this.networkNodes = [];
  this.createNewBlock(0, '0rigin', '0rigin');
}

BLcoin.prototype.createNewBlock = function (nonce, previousBlockHash, hash) {
  const newBlock = {
    index: this.chain.length + 1,
    timestamp: Date.now(),
    transactions: this.pendingTransactions,
    nonce: nonce,
    previousBlockHash: previousBlockHash,
    hash: hash
  };

  this.pendingTransactions = [];
  this.chain.push(newBlock);
  return newBlock;
};

BLcoin.prototype.getLastBlock = function () {
  return this.chain[this.chain.length - 1];
};

BLcoin.prototype.createNewTransaction = function (amount, sender, recipient) {
  const newTransaction = {
    amount: amount,
    sender: sender,
    recipient: recipient
  };

  this.pendingTransactions.push(newTransaction);
  return this.getLastBlock()['index'] + 1;
};

BLcoin.prototype.addPendingTransaction = function(transactionObj) {
  this.pendingTransactions.push(transactionObj);
  return this.getLastBlock()['index'] + 1;
};

BLcoin.prototype.hashBlock = function (previousBlockHash, currentBockData, nonce) {
  const dataString = previousBlockHash + currentBockData + nonce.toString() + JSON.stringify(currentBockData);
  return SHA256(dataString);
};

BLcoin.prototype.proofOfWork = function (previousBlockHash, currentBlockData) {
  let nonce = 0;
  let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
  // need to generate hash that begins with 4 zeros
  while (hash.substring(0, 4) !== '0000') {
    nonce++;
    hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
  }

  return nonce;
};

module.exports = BLcoin;
