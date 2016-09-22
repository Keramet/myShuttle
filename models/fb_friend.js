'use strict';
const mongoose = require('mongoose');

let friendSchema = new mongoose.Schema({
    name      : String,
    idFb      : { type: String, unique: true },
    gender    : String,
    picUrl    : String,
    createdOn : { type: Date, default: Date.now },
}); 


friendSchema.statics.findAllIdFb = function (cb) {
    return this.find({}).select('idFb').exec( cb );
}



module.exports = mongoose.model('Friend', friendSchema);