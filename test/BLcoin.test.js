require('mocha');
const {expect} = require('chai');
const Blockchain = require('../src/BLcoin.js');


describe(`BLcoin Testing`, () => {

  let BLcoinJS;

  beforeEach(async () => {
    BLcoinJS = new Blockchain();
  })

  describe(`Token tests`, () => {

    it(`createNewBlock creates a new block`, async () => {
      let result = BLcoinJS.createNewBlock(2389, 'OINA90SDNF90N', '90ANSD9F09ASDF');
      expect(result).to.be.a('object');
      expect(result).to.have.all.keys('index', 'timestamp', 'transactions', 'nonce', 'previousBlockHash', 'hash');
      expect(result.transactions).to.be.a('array');
      expect(result.transactions.length).to.equal(0);
      expect(BLcoinJS.chain.length).to.equal(2)
      let lastBlock = BLcoinJS.getLastBlock();
      expect(lastBlock).to.equal(result);
    }).timeout(3000);

    it(`make sure the new block got added`, async () => {
      expect(BLcoinJS.chain).to.be.a('array');
      expect(BLcoinJS.chain[0]).to.have.all.keys('index', 'timestamp', 'transactions', 'nonce', 'previousBlockHash', 'hash');
      expect(BLcoinJS.chain[0].index).to.equal(1);
      expect(BLcoinJS.chain[0].previousBlockHash).to.equal('origin');
      expect(BLcoinJS.chain[0].hash).to.equal('origin');
    }).timeout(3000);

    it(`add a third block`, async () => {
      BLcoinJS.createNewBlock(2899, 'UINIUN90ANSDF', '99889HBAIUSBDF');
      expect(BLcoinJS.chain.length).to.equal(2);
    }).timeout(3000);

    it(`createNewTransaction returns a new transaction object`, async () => {
      let transferAmt = 100;
      let sender = 'B90000000000000';
      let recipient = 'C90000000000000';
      let result = BLcoinJS.createNewTransaction(transferAmt, sender, recipient);
      expect(result).to.be.a('object');
      expect(result).to.have.all.keys('amount', 'sender', 'recipient', 'transactionId');
      expect(result.amount).to.equal(transferAmt);
    }).timeout(3000);

    it(`addPendingTransaction adds a transaction object to the pendingTransactions array`, async () => {
      let newTransaction = BLcoinJS.createNewTransaction();
      let result = BLcoinJS.addPendingTransaction(newTransaction);
      expect(result).to.be.a('number').and.equals(BLcoinJS.getLastBlock()['index'] + 1);
      expect(BLcoinJS.pendingTransactions.length).to.equal(1);
    }).timeout(3000);

    it(`add some more transactions`, async () => {
      BLcoinJS.addPendingTransaction(BLcoinJS.createNewTransaction(50, 'OIANSDF0AN07', 'NJNASDNF07ASDF'));
      BLcoinJS.addPendingTransaction(BLcoinJS.createNewTransaction(10, 'OIANSDF0AN08', 'NJNASDNF08Afee'));
      BLcoinJS.addPendingTransaction(BLcoinJS.createNewTransaction(50, 'OIANSDF0AN09', 'NJNASDNF09Afee'));
      expect(BLcoinJS.pendingTransactions.length).to.equal(3);
      expect(BLcoinJS.chain.length).to.equal(1);
    }).timeout(3000);

    it(`create another block`, async () => {
      BLcoinJS.createNewBlock(2899, 'UINIUN90ANSDF', '99889HBAIUSBDF');
      expect(BLcoinJS.chain.length).to.equal(2)
      expect(BLcoinJS.pendingTransactions.length).to.equal(0);
    }).timeout(3000);
  });

  describe(`Consensus tests`, () => {

    const previousHash = 'OIANSDF0AN08OIANSDF0AN08OIANSDF0AN08';
    const currentBlockData = [
      {
        amount: 50,
        sender: 'OIANSDF0AN07',
        recipient: 'NJNASDNF07ASDF'
      },
      {
        amount: 11,
        sender: 'OIANSDF0AN08',
        recipient: 'NJNASDNF08Afee'
      },
      {
        amount: 52,
        sender: 'OIANSDF0AN09',
        recipient: 'NJNASDNF09Afee'
      }
    ];
    const nonce = 1000;

    it(`hashBlock returns a hash of some stuff`, async () => {
      let result = BLcoinJS.hashBlock(previousHash, currentBlockData, nonce);
      expect(result).to.equal('5c316bfab52afe1965f952b0978761339f48cf9f3c47a960216751890072220e');
    }).timeout(3000);

    it('proofOfWork should mine a new block and return its nonce', async () => {
      let result = BLcoinJS.proofOfWork(previousHash, currentBlockData);
      expect(result).to.equal(80993);
    }).timeout(3000);
  });

  describe(`Validation test`, () => {
    let bc1 = {
      "chain": [
        {
          "index": 1,
          "timestamp": 1525295039150,
          "transactions": [],
          "nonce": 100,
          "hash": "0",
          "previousBlockHash": "0"
        },
        {
          "index": 2,
          "timestamp": 1525295064849,
          "transactions": [],
          "nonce": 18140,
          "hash": "0000b9135b054d1131392c9eb9d03b0111d4b516824a03c35639e12858912100",
          "previousBlockHash": "0"
        },
        {
          "index": 3,
          "timestamp": 1525295150900,
          "transactions": [
            {
              "amount": 12.5,
              "sender": "00",
              "recipient": "555dc5d04e4c11e89b44174d1b876bbf",
              "transactionId": "64b4c6504e4c11e89b44174d1b876bbf"
            },
            {
              "amount": 10,
              "sender": "NNFANSDFHYHTN90A09SNFAS",
              "recipient": "IUW099N0A90WENNU234UFAW",
              "transactionId": "881441704e4c11e89b44174d1b876bbf"
            },
            {
              "amount": 20,
              "sender": "NNFANSDFHYHTN90A09SNFAS",
              "recipient": "IUW099N0A90WENNU234UFAW",
              "transactionId": "8c835b604e4c11e89b44174d1b876bbf"
            },
            {
              "amount": 30,
              "sender": "NNFANSDFHYHTN90A09SNFAS",
              "recipient": "IUW099N0A90WENNU234UFAW",
              "transactionId": "92c6e7304e4c11e89b44174d1b876bbf"
            }
          ],
          "nonce": 59137,
          "hash": "0000c09685e31e57318e569b5fe3ca88ced727a29a0eb9cbea633e05056b4c29",
          "previousBlockHash": "0000b9135b054d1131392c9eb9d03b0111d4b516824a03c35639e12858912100"
        },
        {
          "index": 4,
          "timestamp": 1525295192141,
          "transactions": [
            {
              "amount": 12.5,
              "sender": "00",
              "recipient": "555dc5d04e4c11e89b44174d1b876bbf",
              "transactionId": "97fa3b804e4c11e89b44174d1b876bbf"
            },
            {
              "amount": 40,
              "sender": "NNFANSDFHYHTN90A09SNFAS",
              "recipient": "IUW099N0A90WENNU234UFAW",
              "transactionId": "a5d523504e4c11e89b44174d1b876bbf"
            },
            {
              "amount": 50,
              "sender": "NNFANSDFHYHTN90A09SNFAS",
              "recipient": "IUW099N0A90WENNU234UFAW",
              "transactionId": "a8b55fe04e4c11e89b44174d1b876bbf"
            },
            {
              "amount": 60,
              "sender": "NNFANSDFHYHTN90A09SNFAS",
              "recipient": "IUW099N0A90WENNU234UFAW",
              "transactionId": "ab0347804e4c11e89b44174d1b876bbf"
            },
            {
              "amount": 70,
              "sender": "NNFANSDFHYHTN90A09SNFAS",
              "recipient": "IUW099N0A90WENNU234UFAW",
              "transactionId": "ad9738d04e4c11e89b44174d1b876bbf"
            }
          ],
          "nonce": 16849,
          "hash": "00001f3f4e1635cc930cdc41a954d19bcf457eeba8bf6c7be7aa4fe1489e64d3",
          "previousBlockHash": "0000c09685e31e57318e569b5fe3ca88ced727a29a0eb9cbea633e05056b4c29"
        },
        {
          "index": 5,
          "timestamp": 1525295206369,
          "transactions": [
            {
              "amount": 12.5,
              "sender": "00",
              "recipient": "555dc5d04e4c11e89b44174d1b876bbf",
              "transactionId": "b08f1c104e4c11e89b44174d1b876bbf"
            }
          ],
          "nonce": 40153,
          "hash": "000067295fb567842799b887910fe31cc8ca7544ec15a000b65005f6ac50df21",
          "previousBlockHash": "00001f3f4e1635cc930cdc41a954d19bcf457eeba8bf6c7be7aa4fe1489e64d3"
        },
        {
          "index": 6,
          "timestamp": 1525295212959,
          "transactions": [
            {
              "amount": 12.5,
              "sender": "00",
              "recipient": "555dc5d04e4c11e89b44174d1b876bbf",
              "transactionId": "b90a6f704e4c11e89b44174d1b876bbf"
            }
          ],
          "nonce": 252386,
          "hash": "0000462c88b2814ebb930b13ac3c19dc698b2dca27b0c296e03f8a2ea104f74f",
          "previousBlockHash": "000067295fb567842799b887910fe31cc8ca7544ec15a000b65005f6ac50df21"
        }
      ],
      "pendingTransactions": [
        {
          "amount": 12.5,
          "sender": "00",
          "recipient": "555dc5d04e4c11e89b44174d1b876bbf",
          "transactionId": "bcf84b704e4c11e89b44174d1b876bbf"
        }
      ],
      "currentNodeUrl": "http://localhost:3001",
      "networkNodes": []
    };

    it(`validate the blockchain`, async () => {
      let result = BLcoinJS.chainIsValid(bc1.chain);
      expect(result).to.equal(true);
    });
  });
});

