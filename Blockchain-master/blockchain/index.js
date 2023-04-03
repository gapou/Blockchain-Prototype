const SHA256 = require('crypto-js/sha256');
var EC = require('elliptic').ec;
var ec = new EC('secp256k1');
const Block = require('./block');

class Blockchain {
  constructor() {
    this.difficulty = 10;
    let genesis = Block.genesis();
    this.chain = [];
    this.chain.push(genesis);
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(data) {
    this.calDifficulty();
    const lastBlock = this.getLatestBlock();
    const block = Block.mineBlock(lastBlock, data, this.difficulty);
    this.chain.push(block);

    return block;
  }

  calDifficulty() {
    const latestBlock = this.getLatestBlock();
    if (latestBlock.BlockHeader.index % 4 !== 0) {
      return;
    }

    const prevAdjustmentBlock = this.chain[this.chain.length - 4];
    if (typeof prevAdjustmentBlock === 'undefined') {
      return;
    }
    const timeExpected = 15 * 4 ;

    let timeTaken = latestBlock.BlockHeader.timestamp - prevAdjustmentBlock.BlockHeader.timestamp;
    let multiple = timeTaken / timeExpected;
    let adjust = Math.round(Math.log(multiple,2));
    if (adjust < -10){
        adjust = -10;
    }
    this.difficulty -= adjust;
    if (this.difficulty < 1) {
        this.difficulty = 1;
      }
  }

}


module.exports = Blockchain;
