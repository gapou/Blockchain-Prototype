
const SHA256 = require('crypto-js/sha256');
var EC = require('elliptic').ec;
var ec = new EC('secp256k1');
const transactionPool = require('../wallet/transaction-pool').TransactionPool;
const UTXO = require('../wallet/transaction-pool').UTXO;

class TransactionOutput {
  constructor(receiver, amount) {
    this.receiver = receiver;
    this.amount = amount;
}
}

class TransactionInput {
  constructor(txId, txIndex) {
    this.txId = txId;
    this.txIndex = txIndex;
}
}

class Transaction {
  constructor(inputs, outputs) {
    this.inputs = inputs;
    this.outputs = outputs;
}
}


class Miner {
  constructor(blockchain, transactionPool, p2pServer) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.p2pServer = p2pServer;
    this.key = ec.genKeyPair();
    this.publicKey = this.key.getPublic('hex');
    this.privateKey = this.key.getPrivate('hex');
    this.pubhash = SHA256(this.publicKey).toString();
  }

  initiateTransaction(receiver, amount) {
    let inputs = [];
    let outputs = [];
    let total = 0;
    for (let i = 0; i < this.transactionPool.utxo.length; i++) {
        if (this.transactionPool.utxo[i].address === this.pubhash) {
          inputs.push(new TransactionInput(this.transactionPool.utxo[i].txId, this.transactionPool.utxo[i].txIndex));
          total += this.transactionPool.utxo[i].amount;
          if (total >= amount) {
            break;
          }
        }
    }
    if (total < amount) {
        console.log('Insufficient balance');
        return null;
    }
    outputs.push(new TransactionOutput(receiver, amount));
    if (total > amount) {
        outputs.push(new TransactionOutput(this.pubhash, total - amount));
    }
    let tx = new Transaction(inputs, outputs);
    tx.txId = SHA256(JSON.stringify(tx)).toString();
    for (let i = 0; i < tx.inputs.length; i++) {
        let input = tx.inputs[i];
        input.sig = [this.key.sign(tx.txId).toDER('hex') , this.publicKey];
      }
    if (this.transactionPool.verifyTransaction(tx)) {
        console.log('Transaction verified');
        this.transactionPool.AddTransaction(tx);
        console.log('Transaction created');
    } else {
          console.log('Transaction verification failed');
      }
      this.transactionPool.txIDRecord.push(tx.txId);
      return tx;  
  }

  createCoinbaseTransaction(receiver, amount) {
    let tx = new Transaction([], [new TransactionOutput(receiver, amount)]);
    tx.txId = SHA256(JSON.stringify(tx)).toString();
    return tx;
  }


  Mining2() {
    let count = 0;
    let del = [];
    let transaction = [];
    if (this.transactionPool.transactions.length === 0) {
      let tx = this.createCoinbaseTransaction(this.pubhash, 10);
      transaction.push(tx);
      const block = this.blockchain.addBlock(transaction);
      this.transactionPool.AddUTXO(new UTXO(tx.txId, 0, this.pubhash, 10));
      return block;
    }
    for (let i = 0; i < this.transactionPool.transactions.length; i++) {
      count += 1;
      transaction.push(this.transactionPool.transactions[i]);
    }
      transaction.push(this.createCoinbaseTransaction(this.pubhash, 10));
      const block = this.blockchain.addBlock(transaction);

      for (let i = 0; i < transaction.length; i++) {
          let tx = transaction[i];
          for (let j = 0; j < tx.inputs.length; j++) {
            this.transactionPool.deleteUTXO(tx.inputs[j].txId, tx.inputs[j].txIndex);
          }
          for (let j = 0; j < tx.outputs.length; j++) {
              let output = tx.outputs[j];
              this.transactionPool.AddUTXO(new UTXO(tx.txId, j, output.receiver, output.amount));
          }
      }

      this.transactionPool.clear();
      return block;
  }
}


module.exports = Miner;
