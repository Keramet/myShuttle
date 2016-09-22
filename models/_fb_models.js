console.log("REQURE  _fb_models.js");

'use strict';
const mongoose = require('mongoose');

let FB = {};

/* *********************
          FRIEND
   ********************* */ 
let friendSchema = new mongoose.Schema({
    name      : String,
    idFb      : { type: String, unique: true },
    gender    : String,
    picUrl    : String,
    createdOn : { type: Date, default: Date.now },
}); 

FB.Friend = mongoose.model('Friend', friendSchema);

/* *********************
           POST
   ********************* */ 
let postSchema = new mongoose.Schema({
    createdOn : Date,
    picUrl    : [ String ],
    idFb      : { type: String, unique: true }, 
    message   : String,
    name      : { type: String, default: "Unnamed" }
});


FB.Post = mongoose.model('Post', postSchema);

FB.savaAllPosts = (data) => {
    let rezult = [],
        count  = data.length;

    data.forEach( el => {
        let post = new FB.Post({
            createdOn: el.created_time,
            picUrl:    el.full_picture,
            idFb:      el.id, 
            message:   el.message,
            name:      el.name
        });

        rezult.push(post);

        post.save( err => {
            if (err) {
                console.log(`Error in save post: ${err}`);
            } else {
                console.log(`Save post......[ OK ]  Post: ${post}`);
            }
        });
    });

    return rezult;
}


FB.getFeedPosts = (req, res, next) => {
    

}




module.exports = FB;