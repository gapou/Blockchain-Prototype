const SHA256 = require('crypto-js/sha256');
var EC = require('elliptic').ec;
var ec = new EC('secp256k1');
class UTXO{
  constructor(txId, txIndex, address, amount){
    this.txId = txId;
    this.txIndex = txIndex;
    this.address = address;
    this.amount = amount;
}
}
class TransactionPool {
  constructor() {
    this.transactions = [];
    this.utxo = [];
  }

  AddTransaction(transaction) {
    this.transactions.push(transaction);
  }



  deleteTransaction(txId) {
    for (let i = 0; i < this.transactions.length; i++) {
      if (this.transactions[i].txId === txId) {
        this.transactions.splice(i, 1);
      }
    }
  }

  verifyTransaction(tx) {
    for (let i = 0; i < tx.inputs.length; i++) {
        let input = tx.inputs[i];
        let uxto = this.findUxto(input.txId, input.txIndex);
        if (uxto === null) {
            console.log('Invalid transaction');
            return false;
        }

        if (uxto.address !== SHA256(input.sig[1]).toString()) {
            console.log('Invalid transaction');
            return false;
        }
        let key = ec.keyFromPublic(input.sig[1], 'hex');
        if (!(key.verify(tx.txId, input.sig[0]))) {
            console.log('Invalid transaction');
            return false;
        }
    }
    console.log('Transaction verified');
    return true;
  }

  findUxto(txId, txIndex) {
    for (let i = 0; i < this.utxo.length; i++) {
        if (this.utxo[i].txId === txId && this.utxo[i].txIndex === txIndex) {
            return this.utxo[i];
        }
    }
    return null;
}

  AddUTXO(utxo){
    this.utxo.push(utxo);
  }

deleteUTXO(txID, txIndex){
  for (let i = 0; i < this.utxo.length; i++) {
    if (this.utxo[i].txId === txID && this.utxo[i].txIndex === txIndex) {
      this.utxo.splice(i, 1);
      break;
    }
  }
}

  clear() {
    this.transactions = [];
  }
}

module.exports = {UTXO, TransactionPool};
