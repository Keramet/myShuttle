// this route is to testing response with error-messages
"use strict";

const express  = require('express'),
      router   = express.Router(),
      ErrorAPI = require('../errors/error-handling').ErrorAPI ;


router.route('/')
    .get( (req, res) => res.send('You are at the page to test error-handlng.') )
    .post( (req, res, next) => {
        let error = new Error('Can\'t post to this url!');
        error.status = 405;
        next(error);
    })
    .all( (req, res, next) => {
        let error = new Error('Method not acceptable...');
        error.status = 406;
        next(error);
    }) ;

// test async function 
router.get('/a', (req, res, next) => {
    asyncF()
        .then( data => res.send(data) )
        .catch( err => next(err) );
});

router.get('/e', (req, res, next) => {
    next( new ErrorAPI('my custom Error', 403) );
});

router.get('/1', (req, res, next) => {
    throw new Error("Just throw an error");
});

router.get('/2', (req, res, next) => {
    next( new Error('Some wierd error!') );
});

router.get('/3', (req, res, next) => next("get error"));

router.get('/4', (req, res, next) => {
    let error = new Error('WTF????');
    error.status = 'wtf';
    next(error);
});

router.get('/5', (req, res, next) => {
    let error = new Error('This resource moved permanently');
    error.status = 301;
    next(error);
});


module.exports = router;


function asyncF() {
    return new Promise( (res, rej) => {
        let r = Math.random();

        console.log('r = ', r.toFixed(2));
        setTimeout( () => {
            r > 0.5 ? res("ALL OK!!!")
                    : rej('Got error in function asyncF()');
        }, 1000);
    });
}