function requestMaker(httpMethod, reqpath) {
     // Define your request
     let key = "YOUR BITSO API KEY";
     let secret = "YOUR BITSO API SECRET";
     let http_method = httpMethod || "GET";  // Change to POST if endpoint requires data
     let request_path = reqpath || "/v3/balance/"  // "/v3/open_orders?book=btc_mxn"
     let json_payload = {};    // Needed for POST endpoints requiring data

     // Create the signature
     let nonce = new Date().getTime();
     let message = nonce + http_method + request_path;
     let payload = JSON.stringify(json_payload)
     if (http_method == "POST")
         message += payload;
     let crypto = require('crypto');
     let signature = crypto.createHmac('sha256', secret).update(message).digest('hex');

     // Build the auth header
     let auth_header = "Bitso " + key + ":" + nonce + ":" + signature;

     let options = {
         host: 'api.bitso.com',
         path: request_path,
         method: http_method,
         headers: {
             'Authorization': auth_header,
             'Content-Type': 'application/json'
         }
     };
    return new Promise(function (resolve, reject) {
        // Send request
        let http = require('https');
        let req = http.request(options, function (res) {
            console.log(`statusCode: ${res.statusCode}`);
            console.log(`statusMessage: ${res.statusMessage}`);
            res.on('data', function (chunk) { 
                resolve(JSON.parse(chunk.toString()))
            });
        });
        req.on('error', (error) => {
            reject(error)
        })
        if (http_method == "POST") {
            req.write(payload);
        }
        req.end();



    })

}

exports.requestMaker = requestMaker;