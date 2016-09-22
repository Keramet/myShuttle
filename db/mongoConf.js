'use strict';
const mongoose = require('mongoose')
    , CONN_STR = require('../config').db
    , fs       = require('fs')
    ;

mongoose.connect( CONN_STR );

let conn = mongoose.connection;

conn.on('connected', () => console.log(`Connecting to mongoDB.........[ OK ] `) );
conn.on('error', err => console.log(`ERROR connecting to MongoDB.  ${err}`) ); 
conn.on('disconnected', () => console.log(`Mongoose disconnected from ${CONN_STR}`) );

// If the Node process ends, close the Mongoose connection 
process.on('SIGINT', () => {  
    conn.close( () => { 
        console.log(`App has terminated! Connection to mongoDB closed.`); 
        process.exit(0); 
    } ); 
});

module.exports = conn;
