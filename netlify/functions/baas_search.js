const https = require('https')

const INDEX = 'live_persons_index' // emi_persons
const DEFAULT_SIZE = 200
const MAX_SIZE = 500

exports.handler = (event, context, callback) => {
    let reqBody
    try {
        reqBody = JSON.parse(event.body)
    } catch (e) {
        reqBody = {}
    }

    const from = Math.max(0, parseInt(reqBody._from, 10) || 0)
    const size = Math.min(MAX_SIZE, Math.max(1, parseInt(reqBody._size, 10) || DEFAULT_SIZE))

    // Remove pagination params before forwarding to Elasticsearch
    delete reqBody._from
    delete reqBody._size

    const options = {
        hostname: '94abc9318c712977e8c684628aa5ea0f.us-east-1.aws.found.io',
        port: 9243,
        path: '/' + INDEX + '/_search?size=' + size + '&from=' + from,
        method: 'POST',
        headers: {
            'Authorization': 'Basic cmVhZGVyOnJlYWRlcg==',
            'Content-Type': 'application/json'
        }
    }

    const request = https.request(options, response => {
        var body = ''

        response.on('data', function (d) {
            body += d
        })

        response.on('end', function () {
            callback(null, {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: body
            })
        })
    })

    request.on('error', function () {
        callback(null, {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Elasticsearch request failed' })
        })
    })

    request.write(JSON.stringify(reqBody))
    request.end()
}
