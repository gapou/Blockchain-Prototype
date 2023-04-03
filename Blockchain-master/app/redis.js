const express = require('express');
const redis = require('redis');

const PORT = process.env.PORT || 8000;
const REDIS_PORT = process.env.PORT || 6379;

// Init app
const client = redis.createClient(REDIS_PORT);

const app = express();

async function getRepos(req, res, next){
    try{
        console.log("FD...");
        
        const { username } = req.params;

        const response = await fetch({ username });

        const data = await response.json();

        res.send(data);
    }catch(err){
        console.log(err);
        res.status(500);
    }
}
app.get('/repos', getRepos);

app.listen(8000, ()=>{
  console.log("Server started on port  "+PORT);
});