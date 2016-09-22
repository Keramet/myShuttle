'use strict';
const  express  = require('express')
    ,  router   = express.Router()
    ,  request  = require('request')
    ,  ErrorAPI = require('../errors/error-handling').ErrorAPI
    ,  Post     = require('../models/fb_post')
    ,  Friend   = require('../models/fb_friend')
    ;

const FB_CONF = require('./fb_auth_config');    // FB-app data 

const FIELDS  = {                               // which information we want to get
    post   : 'name,message,created_time,full_picture,story',
    friend : 'gender,name,picture'
}

router.get( '/', (req, res, next) => {
    let  token    = req.app.get('fb_token'),

         loginUrl = 'https://www.facebook.com/dialog/oauth?'
                  + `client_id=${FB_CONF.clientID}`
                  + `&redirect_uri=${FB_CONF.redirect}`
                  + '&scope=public_profile,user_posts,user_friends' 
                  + '&display=popup&response_type=code',

        changeUrl = 'https://graph.facebook.com/v2.7/oauth/access_token?'
                  + `client_id=${FB_CONF.clientID}`
                  + `&redirect_uri=${FB_CONF.redirect}`
                  + `&client_secret=${FB_CONF.clientSecret}`
                  + '&code=';

    if ( token ) {                      // we have got the TOKEN,  now we able to get info
        return res.send(`<p>Your FB token: <b>${token}</b></p>
                         <p>Now you can get any information using this <b>token</b>. For example, get your:
                            <ul>
                                <li><a href='/fb/friends'>Friends</a>, which use this app;</li>
                                <li><a href='/fb/posts'>Feed of posts</a>.</li>
                            </ul>
                         </p>`);
    }

    if ( req.query.code ) {             // we have got the CODE,  now we need to change it for a TOKEN  
        changeUrl += req.query.code;

        requestPromise(changeUrl)
            .then( data => {
                req.app.set( 'fb_token', data.access_token ); 
                res.redirect('/fb'); 
            })
            .catch( err => next(err) ); 

    } else if ( req.query.error ) {     // user denied our app
        let message = req.query.error + ': '
                    + req.query.error_description + ' - '
                    + req.query.error_reason;

        next( new ErrorAPI(message, 401) ); 

    } else {                            // requiring a CODE
        res.redirect( loginUrl );
    }
});

// router.get( '/friends',  routeFunc('friends', 'gender,name,picture', fbFriends) );
router.get( '/friends', streamFromDb(Friend, '-createdOn') );

router.get( '/fid', (req, res, next) => {
    let arr = [];
    Friend.findAllIdFb( (err, ids) => {
        if (err) {
            res.send(err);
        } else {
            ids.forEach(el => arr.push(el.idFb));
            
            
            res.send(arr);
        }
    });
})

let feedOpts = { 
    fields: FIELDS.post,
    limit : 5
};
// router.get( '/feed_posts', routeFunc('feed', feedOpts, FB.savaAllPosts) );  
router.get( '/feed_posts', routeFunc('feed', feedOpts, Post.savaAllPosts) );  


router.get( '/feed_posts/refresh',
    Post.getLRDate,
    getReqUrl('feed', FIELDS.post),
    makeReqThenProc(Post.getFeedPosts)
); 


router.get( '/posts', streamFromDb(Post, '-createdOn') );

// router.use( '/posts/refresh', Post.getLRDate1 );
router.use( '/posts/refresh', (req, res, next) => {
    Post.getLRDate( (err, lrDate) => {
        if (err) {
            next(err);
        } else {
            if (lrDate) {
                req.sinceDate = Date.parse(lrDate.createdOn) / 1000;
            }       
            next();
        }
    } );
});
router.get( '/posts/refresh',
    getReqUrl('feed', FIELDS.post),
    makeReqThenProc(Post.saveNew)
); 


router.get( '/search/:q/:limit',  (req, res, next) => {
    let token  = req.app.get('fb_token'),
        q      = req.params.q,
        limit  = req.params.limit || 7,
        url    = `https://graph.facebook.com/search?access_token=${token}&q=${q}&type=user&limit=${limit}`;

    if ( !token )  {
        return res.redirect('/fb');         // user is not authorized in FB
    }

    requestPromise( url )
        .then( data => res.json(data) ) 
        .catch( err => next(err) );

}); 



module.exports = router;


//-------  Functions implementation  -------//


function streamFromDb(model, sortField) { // get info from DB

    return (req, res, next) => {  
        let cursor = model.find({}).sort(sortField).cursor(),
            count  = 0;
    
        res.set("Content-Type", "application/json; charset=utf-8");
        cursor
            .on( 'data', chunk => {
                res.write( JSON.stringify(chunk) );
                count++;
            })
            .on( 'error', err => next(err) )
            .on( 'end', () => res.end(`\n\n *** The END  (got ${count} docs) ***`) );
    } 
}


/**
 * Create hanlding function for route, which requests data from FB API.
 *
 * @param {string}          endPoint
 * @param {object, string}  options (optional)  - Contain additional query parameters.
 * @param {function}        whenRespGet  - function, which proccessing primary response data and
 *                                         generate final response. 
 *
 * @return {function} 
 */
function routeFunc(endPoint, options, processingResp) {  
    return (req, res, next) => {
        let token  = req.app.get('fb_token'),
            reqUrl = `https://graph.facebook.com/me/${endPoint}?access_token=${token}`;

        if ( !token )  {
            return res.redirect('/fb');  // пользователь не авторизирован в ФБ
        }

        if (typeof options === 'string') {
            reqUrl += `&fields=${options}`;
        } else {
            for (let prop in options) { 
                reqUrl += `&${prop}=${options[prop]}`;
            }
        }

        requestPromise( reqUrl )
            .then( resp => processingResp(resp.data) )
            .then( resultData  => res.json(resultData) ) 
            .catch( err => next(err) );

        // requestPromiseS( reqUrl, res )
        //     .then( resp => processingResp(resp) )
        //     .then( resultData  => console.log(`All data saved: ${resultData}`) )
        //     .catch( err => next(err) );

    }
}

/**
 * Make async request to specified URL.
 *
 * @param {string}  url
 * @param {boolean}  consoleBody (optional)  - If true, log to console formatted  body of response.
 *
 * @return {promise} 
 */
function requestPromise(url) {
    return new Promise( (res, rej) => {

        request.get(url, (err, response, body) => {

            if (err) {
                rej( new ErrorAPI(err.message, 400) );
            } else {
                response.statusCode === 200         
                    ? res( JSON.parse(body) )
                    : rej( new ErrorAPI( JSON.parse(body).error.message, response.statusCode ) );
            }
            console.log(' ***  Response.statusCode: ......[', response.statusCode, '].     Error: ......[', err, '].' );
        });
    });
}


function requestPromiseS (url, resStream) {
    return new Promise( (res, rej) => {

        request
            .get( url )
            .on( 'response', resp => {
                console.log(`Get response: ${resp}`);
                res(resp);
            })
            .on( 'error', err => {
                console.log(err);
                rej(err);
            })
            .pipe( resStream ); 
    });
}


function getReqUrl (endPoint, options) {

    return (req, res, next) => {
        let token  = req.app.get('fb_token'),
            reqUrl = `https://graph.facebook.com/me/${endPoint}?access_token=${token}`;

        if ( !token )  {
            return res.redirect('/fb');  // user is not authorized in FB
        }

        if (typeof options === 'string') {
            reqUrl += `&fields=${options}`;
        } else {
            for (let prop in options) { 
                reqUrl += `&${prop}=${options[prop]}`;
            }
        }

        if (req.sinceDate) {
            reqUrl += `&since=${req.sinceDate}`;
        }

        req.requestUrl = reqUrl;
        next();
    }
}

function makeReqThenProc(processingResp, url) {
    return (req, res, next) => {
        url = url || req.requestUrl;

        requestPromise( url )
            .then( resp => processingResp(resp.data) )
            .then( resultData  => res.json(resultData) ) 
            .catch( err => next(err) );
    }
}





function fbFriends (data) {
    let rezult = [],
        count  = data.length;

    data.forEach( el => {
        // let friend = new FB.Friend({
        let friend = new Friend({    
            name:   el.name,
            idFb:   el.id,
            gender: el.gender,
            picUrl: el.picture.data.url
        });

        rezult.push(friend);

        friend.save( err => {
            if (err) {
                console.log(`Error in save: ${err}`);
            } else {
                console.log(`Save ok!! Friend: ${friend}`);
                // return friend; //JSON.stringify(friend);
            }
        });
    });

    return rezult;
}
