const https = require('https')

const INDEX = 'live_persons_index' // emi_persons

exports.handler = (event, context, callback) => {
    const options = {
        hostname: '94abc9318c712977e8c684628aa5ea0f.us-east-1.aws.found.io',
        port: 9243,
        path: '/' + INDEX + '/_search?size=5000&from=0',
        method: 'POST',
        headers: {
            'Authorization': 'Basic cmVhZGVyOnJlYWRlcg==',
            'Content-Type': 'application/json'
        }
    }

    const request = https.request(options, response => {
        // Decode upstream stream as UTF-8 so multi-byte characters split
        // across TCP chunk boundaries are not corrupted into U+FFFD.
        response.setEncoding('utf8')
        let body = ''

        response.on('data', function (d) {
            body += d
        })

        response.on('end', function () {
            callback(null, {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: body
            })
        })
    })

    request.on('error', function () {
        callback(null, {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({ error: 'Elasticsearch request failed' })
        })
    })

    request.write(event.body)
    request.end()
}
