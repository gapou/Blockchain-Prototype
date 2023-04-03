const SHA256 = require('crypto-js/sha256');
var EC = require('elliptic').ec;
var ec = new EC('secp256k1');
class BlockHeader{
  constructor(index, timestamp, prevHash, hash, difficulty, nonce, merkleRoot) {
    this.index = index;
    this.timestamp = timestamp;
    this.prevHash = prevHash;
    this.hash = hash;
    this.difficulty = difficulty;
    this.nonce = nonce;
    this.merkleRoot = merkleRoot;
  }
}

class Block {
    constructor(index, timestamp, prevHash, hash, difficulty, nonce, merkleRoot, data) {
      this.BlockHeader = new BlockHeader(index, timestamp, prevHash, hash, difficulty, nonce, merkleRoot);
      this.data = data;
    }

    static genesis() {
      const index = 0;
      const prevHash = 'no prev hash in genesis block';
      const data = ['0'];
      let merkleRoot = Block.merkleRoot(data);
      let timestamp = 324567868 ; 
      let difficulty = 5;
      let nonce = 0;
      let hash = Block.calculateHash(index, timestamp, prevHash, difficulty, nonce, merkleRoot);
      while (Block.calLeadingZeros(hash) < difficulty) {
          nonce++;
          hash = Block.calculateHash(index.toString(), timestamp.toString(), prevHash.toString(), difficulty.toString(), nonce.toString(), merkleRoot);
      }
      return new this(index, timestamp, prevHash, hash, difficulty, nonce, merkleRoot, data);
    }

    static calculateHash(index, timestamp, prevHash, difficulty, nonce, merkleRoot) {
      const string = `${index}${timestamp}${prevHash}${difficulty}${nonce}${merkleRoot}`;
      return SHA256(SHA256(string).toString()).toString();
    }

    static calLeadingZeros(hash) {
      let zeros = 0;
      let non_zero =0;
      for (let i = 0; i < hash.length ; i++) {
          if (hash[i] == '0') {
              zeros++;}
          else {
              non_zero = hash[i];
              break;}
      }
      let bin = parseInt(non_zero.toString(), 16).toString(2);
      zeros = zeros*4 + 4 - bin.length;
      return zeros;
  }

    static mineBlock(lastBlock, data, difficulty) {
      let index = lastBlock.BlockHeader.index + 1;
      let prevHash = lastBlock.BlockHeader.hash;
      let nonce = 0;

      let merkleRoot = Block.merkleRoot(data);
      let timestamp = new Date().getTime()/1000|0 ; 
      let hash = Block.calculateHash(index, timestamp, prevHash, difficulty, nonce, merkleRoot);
      while (Block.calLeadingZeros(hash) < difficulty) {
          nonce++;
          timestamp = new Date().getTime()/1000|0 ;
          hash = Block.calculateHash(index, timestamp, prevHash, difficulty, nonce, merkleRoot);
      }
      return new this(index, timestamp, prevHash, hash, difficulty, nonce, merkleRoot, data);
    }

    static merkleRoot(data) {
      let merkleRoot = [];
      for (let i = 0; i < data.length; i++) {
        merkleRoot.push(SHA256(data[i].toString()).toString());
      }
      while (merkleRoot.length > 1) {
        let temp = [];
        for (let i = 0; i < merkleRoot.length; i += 2) {
          if (i + 1 < merkleRoot.length) {
              temp.push(SHA256(merkleRoot[i] + merkleRoot[i + 1]).toString());
          } else {
            temp.push(SHA256(merkleRoot[i] + merkleRoot[i]).toString());
          }
        }
        merkleRoot = temp;
      }
      let m = merkleRoot[0];
      return m;
    }

}

module.exports = Block;
