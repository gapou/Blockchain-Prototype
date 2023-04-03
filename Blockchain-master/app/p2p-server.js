const Websocket = require('ws');
const SHA256 = require('crypto-js/sha256');
var EC = require('elliptic').ec;
var ec = new EC('secp256k1');
const UTXO = require('../wallet/transaction-pool').UTXO;
const P2P_PORT = process.env.P2P_PORT || 5001;

// ws://localhost:5001, ws://localhost:5002 ....
const peers = process.env.PEERS ? process.env.PEERS.split(',') : [];

const MESSAGE_TYPES = {
  chain: 'CHAIN',
  transaction: 'TRANSACTION',
  clear_transactions: 'CLEAR_TRANSACTIONS'
};

class P2pServer {
  constructor(blockchain, transactionPool) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.sockets = [];
    this.transactionPool.txIDRecord = [];
  }

  listen() {
    const server = new Websocket.Server({port: P2P_PORT});

    // Connect incoming socket requests to server - event listener
    server.on('connection', socket => this.connectSocket(socket));

    // Connect this server to all its peers
    this.connectToPeers();

    //console.log(`Listening for peer to peer connections on ${P2P_PORT}`);
  }

  connectToPeers() {
    peers.forEach(peer => {
      const socket = new Websocket(peer);

      socket.on('open', () => this.connectSocket(socket));
    });
  }

  connectSocket(socket) {
    this.sockets.push(socket);
    console.log('Socket connected');

    // All connected sockets
    this.messageHandler(socket);

    this.sendChain(socket);
    this.sendTransactionPool(socket);
  }

  messageHandler(socket) {
    socket.on('message', message => {
      const data = JSON.parse(message);
      switch(data.type) {

        case MESSAGE_TYPES.transaction:
          // add broadcasted transaction to pool
          for (let i = 0; i < this.transactionPool.txIDRecord.length; i++){
            if (this.transactionPool.txIDRecord[i] == data.transaction.txId){
              return;
            }
          }

          this.transactionPool.txIDRecord.push(data.transaction.txId);
          if(data.transaction != null){
            if (this.transactionPool.verifyTransaction(data.transaction)){
              this.transactionPool.AddTransaction(data.transaction);
              this.broadcastTransaction(data.transaction);
            }
          }
          break;

        case MESSAGE_TYPES.Block:
          const string = `${data.Block.BlockHeader.index}${data.Block.BlockHeader.timestamp}${data.Block.BlockHeader.prevHash}${data.Block.BlockHeader.difficulty}${data.Block.BlockHeader.nonce}${data.Block.BlockHeader.merkleRoot}`;

          if (data.Block.BlockHeader.prevHash !== this.blockchain.getLatestBlock().BlockHeader.hash) {
            break;
          }
          if (data.Block.BlockHeader.hash !== SHA256(SHA256(string).toString()).toString()){
            break;
          }
          this.blockchain.chain.push(data.Block);
          for (let i = 0; i < data.Block.data.length; i++) {
            let tx = data.Block.data[i];
            for (let j = 0; j < tx.inputs.length; j++) {
              this.transactionPool.deleteUTXO(tx.inputs[j].txId, tx.inputs[j].txIndex);
            }
            for (let j = 0; j < tx.outputs.length; j++) {
                let output = tx.outputs[j];
                this.transactionPool.AddUTXO(new UTXO(tx.txId, j, output.receiver, output.amount));
            }
            this.transactionPool.deleteTransaction(data.Block.data[i].txId);
          }
          this.broadcastBlock(data.Block);
          break;


        default:
          break;
      }
    });
  }

  sendChain(socket) {
    for(let i = 0; i < this.blockchain.chain.length; i++){
      let Block = this.blockchain.chain[i];
      socket.send(JSON.stringify({
        type: MESSAGE_TYPES.Block,
        Block 
      }));
    }
  }

  sendTransactionPool(socket) {
    for(let i = 0; i < this.transactionPool.transactions.length; i++){
      let transaction = this.transactionPool.transactions[i];
      socket.send(JSON.stringify({
        type: MESSAGE_TYPES.transaction,
        transaction 
      }));
    }
  }

  broadcastBlock(Block) {
    this.sockets.forEach(socket => {
      this.sendBlock(socket, Block);
    });
  }

  sendBlock(socket, Block) {
    socket.send(JSON.stringify({
      type: MESSAGE_TYPES.Block,
      Block
    }));
  }

  broadcastTransaction(transaction) {
    this.sockets.forEach(socket => {
      this.sendTransaction(socket, transaction);
    });
  }

  sendTransaction(socket, transaction) {
    socket.send(JSON.stringify({
      type: MESSAGE_TYPES.transaction,
      transaction
    }));
  }

};

module.exports = P2pServer;
