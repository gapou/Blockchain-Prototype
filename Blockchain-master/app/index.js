const express = require("express");
const Blockchain = require("../blockchain");
const bodyParser = require("body-parser");
const P2pServer = require("./p2p-server");
const TransactionPool = require("../wallet/transaction-pool").TransactionPool;
const Miner = require("./miner");
const redis = require('redis');
//New client
const redisclient = redis.createClient(); 
let mongoose = require("mongoose");
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});
const chalk = require("chalk");
const { count } = require("console");
const HTTP_PORT = process.env.HTTP_PORT || 3001;
const redis_port = 8000;



const app = express();
const bc = new Blockchain();
const tp = new TransactionPool();
const p2pServer = new P2pServer(bc, tp);
//console.log(tp.transactions);
// A miner consisting of the local blockchain, transaction pool,
// currency wallet and the p2pServer
const miner = new Miner(bc, tp, p2pServer);

app.use(bodyParser.json());
mongoose.connect(
  "mongodb://localhost:27017/BlockChainsDB",
  { useNewUrlParser: true, useUnifiedTopology: true },
  (err) => {
    if (err) {
      return console.log("cannot connect to MongoDB");
    } else console.log("Database is connected");
  }
);
//BlockChainDB
const BlockSchema = new mongoose.Schema({
  index: {
    type: Array,
    require: false,
  },
});

const BlockModel = new mongoose.model("Block", BlockSchema);
var countBlockDB= 0;
var countTranDB= 0;

const BlockData = async () => {
  if (countBlockDB < 1) {
      //insertMany
        const result = await BlockModel.insertMany({
          index: bc.chain,
        });            
        console.log(result);
        countBlockDB = 1;
  } else {
      //updateMany
        const result = await BlockModel.updateMany({
          index: bc.chain,
        });            
        console.log(result);
  }

};

//TransactionDB
const TranSchema = new mongoose.Schema({
  index: {
    type: Array,
    require: false,
  },
});

const TranModel = new mongoose.model("Transaction", TranSchema);
const TranData = async () => {
  if (countTranDB < 1) {
    const result = await TranModel.insertMany({
      index: tp.utxo,
    });
    console.log(result);
    countTranDB = 1;
  } else {
    const result = await TranModel.updateMany({
      index: tp.utxo,
    });
    console.log(result);
  }

};

app.get("/blocks", (req, res) => {
  res.json(bc.chain);
});

app.get("/utxo", (req, res) => {
  res.json(tp.utxo);


});

app.get("/transactions", (req, res) => {
  res.json(tp.transactions);
});

app.get("/broadcastChain", (req, res) => {
  for (let i = 0; i < bc.chain.length; i++) {
    let Block = bc.chain[i];
    p2pServer.broadcastBlock(Block);
  }
  res.json(bc.chain);
});

app.get("/broadcastBlock", (req, res) => {
  let Block = bc.chain[bc.chain.length - 1];
  p2pServer.broadcastBlock(Block);
  res.json(Block);
});

app.post("/transact", (req, res) => {
  const { recipient, amount } = req.body;
  const transaction = miner.initiateTransaction(recipient, amount);
  console.log("----------------------------enter transact");
  console.log(transaction);
  if (transaction) {
    console.log("----------------------------enter broadcast transact ");
    p2pServer.broadcastTransaction(transaction);
    res.redirect("/transactions");
  }
});

/**
 * Mine block containing transactions
 */
app.get("/mine-transactions", (req, res) => {
  const block = miner.Mining2(tp);
  //p2pServer.broadcastBlock(block);
  console.log(`New block added ${block.toString()}`);

  res.redirect("/blocks");
});

app.listen(HTTP_PORT, () => console.log(''));
p2pServer.listen();

// Menu
function Menu() {
  readline.question(
    "-------------------------------------- \n" +
      "Please select one service in the menu by inputting the number! \n" +
      "1. Mining\n" +
      "2. Broadcast Chain \n" +
      "3. Transaction(Auto-Broadcast) \n" +
      "4. List UTXO \n" +
      "5. Print Blockchain \n" +
      "6. Public Key hash \n" +
      "7. Check Port \n" +
      "8. Exit \n" +
      "-------------------------------------- \n" +
      "Your Option: ",
    (input) => {
      switch (input) {
        case "1":
          console.log(
            chalk.green(
              "Mining.---------------------------------------------------------------------------------"
            )
          );
          const block = miner.Mining2(tp);
          
          //p2pServer.broadcastBlock(block);
          console.log(`New block added ${block.toString()}`);


          //------------------------------------------------------------------------
          //add function
          //BlockChain

          
          BlockData();
          //------------------------------------------------------------------------
          

          console.log(
            chalk.yellow("\n--------------------------------------\n")
          );
          setTimeout(() => {
            Menu();
          }, 500);

          break;


        case "2":
          console.log(chalk.green("Broadcast chain."));
          for (let i = 0; i < bc.chain.length; i++) {
            let Block = bc.chain[i];
            p2pServer.broadcastBlock(Block);
          }

          console.log(chalk.yellow("\n--------------------------------------\n"));

          setTimeout(() => {
            Menu();
          }, 500);
          break;

        case "3":
          console.log(chalk.green("Transaction.--------------------------------------"));
          //------------------------------------------------------------------------
          Menutran();
          break;


        case "4":
          console.log(chalk.green("List UTXO."));
          console.log(tp.utxo);
          //------------------------------------------------------------------------
          //add function

          TranData();
          //------------------------------------------------------------------------
          console.log(
            chalk.yellow("\n--------------------------------------\n")
          );
          setTimeout(() => {
            Menu();
          }, 500);
          break;


        case "5":
          console.log(chalk.green("\n Print Blockchain: "));
          
          //------------------------------------------------------------------------
          //add function
          console.log(bc.chain);



          //------------------------------------------------------------------------


          setTimeout(() => {
            Menu();
          }, 500);
          break;


        case "6":
          //console.log(chalk.green('Your Public Key hash is: \n' + ''));
          console.log(
            chalk.green("\nYour Public Key is: ") + chalk.yellow(miner.pubhash)
          );

          //------------------------------------------------------------------------
          //add function
          //------------------------------------------------------------------------

          console.log(
            chalk.yellow("\n--------------------------------------\n")
          );
          setTimeout(() => {
            Menu();
          }, 500);
          break;

        case "7":
          console.log(chalk.green("\nListening on PORT ") + chalk.yellow(HTTP_PORT));

          console.log(
            chalk.yellow("\n--------------------------------------\n")
          );
          setTimeout(() => {
            Menu();
          }, 500);
          break;

        case "8":
          console.log(
            chalk.yellow("\n--------------------------------------\n")
          );
          console.log(chalk.green("Thank You!"));
          console.log(
            chalk.yellow("\n--------------------------------------\n")
          );
          process.exit();

        default:
          console.log(
            chalk.red(`Warning, do not have this function!!!!!!!!!!.`)
          );
          console.log(
            chalk.yellow("\n--------------------------------------\n")
          );
          setTimeout(() => {
            Menu();
          }, 500);
      }
    }
  );
}
function Menutran() {
  console.log(chalk.green("Transaction."));

  readline.question("Who do you to tranfer to?\n", (pub_key_hash) => {
    readline.question("Please input the Amount\n", (am) => {
      const ts = miner.initiateTransaction(pub_key_hash, am);
      if (ts) {
        console.log("----------------------------enter broadcast transact ");
        p2pServer.broadcastTransaction(ts);
      }
      console.log(ts);
      console.log(chalk.yellow("\n--------------------------------------\n"));
      setTimeout(() => {
        Menu();
      }, 500);
    });
  });
}
//Call the interactive function
Menu();




