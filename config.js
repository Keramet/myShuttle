const port = process.env.PORT || 3000
    , url  = `http://localhost:${port}`
    ;

module.exports = {
    url  : url,
    port : port,
    db   : 'mongodb://localhost:27017/saggdb'
};