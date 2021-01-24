const SHA256 = require('sha256');
const currentNodeUrl = process.argv[3];
const { v4: uuidv4 } = require('uuid');

function BLcoin () {
  this.chain = [];
  this.pendingTransactions = [];
  this.currentNodeUrl = currentNodeUrl;
  this.networkNodes = [];
  this.createNewBlock(100, 'origin', 'origin');
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
  return {
    amount: amount,
    sender: sender,
    recipient: recipient,
		transactionId: uuidv4().split('-').join('')
  };
};

BLcoin.prototype.addPendingTransaction = function(transactionObj) {
  this.pendingTransactions.push(transactionObj);
  return this.getLastBlock()['index'] + 1;
};

BLcoin.prototype.hashBlock = function (previousBlockHash, currentBockData, nonce) {
  const dataString = previousBlockHash + nonce.toString() + JSON.stringify(currentBockData);
  return SHA256(dataString);
};

BLcoin.prototype.proofOfWork = function (previousBlockHash, currentBlockData) {
  let nonce = 0;
  let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
  while (hash.substring(0, 4) !== '0000') {
    nonce++;
    hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
  }

  return nonce;
};

BLcoin.prototype.chainIsValid = function (blockChain) {
  let validChain = true;
  for (let i = 1; i < blockChain.length; i++) {
    const currentBlock = blockChain[i];
    const prevBlock = blockChain[i-1];
    const blockHash = this.hashBlock(prevBlock['hash'], {transactions: currentBlock['transactions'], index: currentBlock['index']}, currentBlock['nonce'])
    if (blockHash.substring(0, 4) !== '0000')
      validChain = false;
    if (currentBlock['previousBlockHash'] !== prevBlock['hash'])
      validChain = false;
  };
  const genesisBlock = blockChain[0];
  const correctNonce = genesisBlock['nonce'] === 100;
  const correctPrevBlockHash = genesisBlock['previousBlockHash'] === 'origin'
  const correctHash = genesisBlock['hash'] === 'origin';
  const correctTransactions = genesisBlock['transactions'].length === 0;
  if (!correctNonce || !correctPrevBlockHash || !correctHash || !correctTransactions)
    validChain = false;
  return validChain;
};

module.exports = BLcoin;
