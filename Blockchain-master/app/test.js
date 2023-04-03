const redis = require('redis');
const client = redis.createClient({
    socket: {
        host: '127.0.0.1',
        port: 6379
    },
    password: 'Comp4142'
});

client.on('error', err => {
    console.log('Error ' + err);
});


client.set('foo', 'bar', redis.print);