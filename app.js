'use strict';
const http       = require('http')
    , express    = require('express')
    , logger     = require('morgan')
    , bodyParser = require('body-parser')
    ;

//dependencies
const fbRoute    = require('./routes/fb_auth.js');
// error handling
const errHandler = require('./errors/error-handling')
    , errRoute   = require('./routes/error-route')
    ;

// Environment variables
const PORT   = require('./config').port
    , app    = express()
    , server = http.createServer(app)
    ;

//Set environment variables
app.set('port', PORT);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// mongoose
const db = require('./db/mongoConf');
db.once('open', () => {
    let host   = db.db.serverConfig.host,
        port   = db.db.serverConfig.port,
        dbname = db.db.databaseName;

    console.log(`Opening DB  mongodb://${host}:${port}/${dbname}.........[ OK ]`);
}); 

app.get('/', (req, res, next) => {
    res.send(`<p>
                 This is a part of web-app <b>Social Aggregator</b>.
                 You can get some information from Facebook, using its API.
              </p>
              <p>
                 First of all, you need user authorization in FB to get acceess_token from FB.<br>
                 <a href='/fb'>Get access token</a>
              </p>`
    );
});

app.use('/fb', fbRoute);
app.use('/e', errRoute); 

app.use(errHandler.get404);
app.use(errHandler.onError);

server.listen(app.get('port'), () => {
    console.log('Listen server on port ' + app.get('port'));
});

module.exports = server;