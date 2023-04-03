
const SHA256 = require('crypto-js/sha256');
 function merkleRoot(data) {
  let merkleRoot = [];
  for (let i = 0; i < data.length; i++) {
    merkleRoot.push(SHA256(data[i].toString()).toString());
  }
  while (merkleRoot.length > 1) {
    let temp = [];
    for (let i = 0; i < merkleRoot.length; i += 2) {
      if (i + 1 < merkleRoot.length) {
          let string = merkleRoot[i] + merkleRoot[i + 1];
          console.log(string);
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
console.log("sdfghjkl");
console.log(merkleRoot([1,2,4,7,9]));