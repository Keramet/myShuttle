'use strict';
const mongoose = require('mongoose');

let postSchema = new mongoose.Schema({
    createdOn : Date,
    picUrl    : [ String ],
    idFb      : { type: String, unique: true }, 
    message   : String,
    name      : { type: String, default: "Unnamed" }
});

// postSchema.statics.savaAllPosts = (data) => {
//     let Post   = mongoose.model('Post'),
//         rezult = [],
//         count  = data.length;

//     data.forEach( el => {
//         let post = new Post({
//             createdOn: el.created_time,
//             picUrl:    el.full_picture,
//             idFb:      el.id, 
//             message:   el.message,
//             name:      el.name
//         });

//         rezult.push(post);

//         post.save( err => {
//             if (err) {
//                 console.log(`Error in save post: ${err}`);
//             } else {
//                 console.log(`Save post......[ OK ]  Post: ${post}`);
//             }
//         });
//     });

//     return rezult;
// }

postSchema.statics.getFeedPosts = (data) => {
    let Post     = mongoose.model('Post'),
        count    = data.length,  
        postList = { newP: [], oldP: [] };
    
    return new Promise( (res, rej) => {

        if ( !data.length ) {
            console.log('There are no new posts');
            res( [] );
        }
        
        data.forEach( (el, idx) => {
            Post.findOne({ idFb: el.id }, (err, postInDb) => {
                if (err) {
                    console.log(`Get error while checking for new post: ${err} `);
                    return rej(err);
                } else {
                    postInDb ? postList.oldP.push(el)
                             : postList.newP.push(el);
                }

                if (idx === count-1) {
                    console.log(`index = ${idx}`);
                    console.log(`count = ${count}`);
                    res( postList );
                }
            });
        });

    });
}



postSchema.statics.saveNew = (data) => {
    let Post   = mongoose.model('Post'),
        count  = data.length;
    
    return new Promise( (res, rej) => {
        if ( !data.length ) {
            res({ "new_posts_count": 0 });
        }
        
        data.forEach( (el, idx) => {
            Post.create({
                createdOn : el.created_time,
                picUrl    : el.full_picture,
                idFb      : el.id, 
                message   : el.message,
                name      : el.name
            }, (err, newPost) => {
                if (err) {
                    rej(`Error while saving new posts: ${err}`);
                } else {
                    if (idx === count-1) {
                        res({ "new_posts_count": count });
                    }
                }
            });
        });

    });
}







// Getting Last Refresh Date
postSchema.statics.getLRDate1 = function (req, res, next) {
    let Post = mongoose.model('Post');

    Post.findOne({}).sort('-createdOn').exec( (err, lrDate) => {
        if (err) {
            next(err);
        } else {
            req.sinceDate = Date.parse( lrDate.createdOn ) / 1000 + 1;
            next();    
        }
    } );
}

postSchema.static('getLRDate', function (cb) {
    return this.findOne({}).sort('-createdOn').exec( cb );
});





module.exports = mongoose.model('Post', postSchema);
