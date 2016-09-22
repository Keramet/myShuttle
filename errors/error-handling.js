"use strict";

class ErrorAPI extends Error {

    constructor(message, statusCode) {
        super(message);
        this.status = statusCode || 500;
        // this.json   = errorJSON(this);
    }

    get json() { return errorJSON(this) }
}

/**
 * errObj - The object contains errors, for which generated particular statusText.
 *
 * @type {object}
 */
const errObj = {       
    '304': 'Not Modified',
    '400': 'Bad Request',
    '401': 'Unauthorized',
    '403': 'Forbidden',
    '404': 'Not Found',
    '405': 'Method Not Allowed',
    '409': 'Conflict',
    '500': 'Internal Server Error',
    '503': 'Service Unavailable'
};

/**
 * errClasses - This array contains common HTTP classes of response, based on
 *              the first digit of the status code. Use for errors, which 
 *              statusCode not in errObj, to specify their statusText.
 *
 * @type {array}
 */
const errClasses = [       
    'Unknown Type',
    'Informational',
    'Success',
    'Redirection',
    'Client Error',
    'Server Error'
];


/**
 * Error-handling object
 *
 * @field {class}     ErrorAPI - Custom error class
 * @field {function}  get404   - Generates error with statusCode 404.
 * @field {function}  onError  - Handling all errors and sends error object as response.
 */
module.exports = {

        ErrorAPI: ErrorAPI,
        
        get404 (req, res, next) {
            let error = new ErrorAPI(`Resource '${req.originalUrl}' does not exist!`, 404);
            next(error);
        },

        onError (err, req, res, next) {
            let errResp = err instanceof ErrorAPI
                ? err.json
                : errorJSON(err);

            errResp.error.xhrReq = req.xhr ? true : false;

            if (req.app.get('env') === 'development') {  
                console.log('Got error: ', errResp);
            }

            res.status(200).json(errResp);
        }

}// end of  module.exports


    /**
     * Create error response as JSON format 
     *
     * @param {object}   err
     *
     * @return {object}  - Error object, which send as response
     *     @field {number}   statusCode
     *     @field {object}   error
     */
    function errorJSON (err) {
        let code   = Number.isInteger(err.status) ? err.status 
                                                  : 500,
            // определяем класс ошибки (один из 5 классов HTTP ответа - см. errClasses)
            eClass = (''+code)[0],    
            // определяем корректное значение для error_type
            eType  = code in errObj ? errObj[code]    
                                    : (eClass >= 1 && eClass <= 5) ? errClasses[eClass]
                                                                   : errClasses[0],
            message = typeof err === 'object' ? err.message
                                              : err;
        return {  
            statusCode: code,
            error: {
                error_type: eType,
                message   : message
            }
        }
    }
  