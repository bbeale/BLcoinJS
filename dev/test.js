const Blockchain = require('./BLcoin.js');

// TODO: write some proper tests

const BLcoinJS = new Blockchain();

BLcoinJS.createNewBlock(2389, 'OINA90SDNF90N', '90ANSD9F09ASDF');
console.log('[+] Expecting chain w/ 1 entry: ');
console.log(BLcoinJS);

BLcoinJS.createNewTransaction(100, 'B90000000000000', 'C90000000000000');
console.log('[+] Expecting chain w/ 1 entry, along with 1 in pendingTransactions: ');
console.log(BLcoinJS);

BLcoinJS.createNewBlock(2899, 'UINIUN90ANSDF', '99889HBAIUSBDF');
console.log('[+] Expecting chain w/ 2 entries.',
  '\nThe pendingTransactions array should be empty since all records are mined: ');
console.log(BLcoinJS);

// BLcoinJS.createNewTransaction(500, 'OIANSDF0AN07', 'NJNASDNF07ASDF');
// BLcoinJS.createNewTransaction(100, 'OIANSDF0AN08', 'NJNASDNF08Afee');
// BLcoinJS.createNewTransaction(5000, 'OIANSDF0AN09', 'NJNASDNF09Afee');
BLcoinJS.createNewTransaction(50, 'OIANSDF0AN07', 'NJNASDNF07ASDF');
BLcoinJS.createNewTransaction(10, 'OIANSDF0AN08', 'NJNASDNF08Afee');
BLcoinJS.createNewTransaction(50, 'OIANSDF0AN09', 'NJNASDNF09Afee');
console.log('[+] Expecting chain w/ 2 entries; previousTransactions w/ 3 entries');
console.log(BLcoinJS);

BLcoinJS.createNewBlock(2899, 'UINIUN90ANSDF', '99889HBAIUSBDF');
console.log('[+] Expecting chaing w/ 3 entries',
  'the last two contain our transactions',
  'previousTransactions empty');
console.log(BLcoinJS);

console.log('[?] looking at an index: ')
console.log(BLcoinJS.chain[2]);

const MineTester = new Blockchain();

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

console.log('[+] hash bash, man: ');
console.log(MineTester.hashBlock(previousHash, currentBlockData, nonce));

console.log('[+] Expecting a nonce value: ')
console.log(MineTester.proofOfWork(previousHash, currentBlockData));

MineTester.createNewTransaction(500, 'OIANSDF0AN07', 'NJNASDNF07ASDF');
console.log(MineTester.proofOfWork(previousHash, currentBlockData));

console.log(MineTester);
console.log(MineTester.chain[2]);




