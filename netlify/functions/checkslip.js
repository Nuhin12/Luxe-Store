const FormData = require('form-data');

const SLIPOK_API_KEY = 'SLIPOKM37EF7F';
const SLIPOK_BRANCH_ID = '66986';

exports.handler = async function(event) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const body = JSON.parse(event.body);
        const { imageBase64, mimeType } = body;

        if (!imageBase64) {
            return { statusCode: 400, headers, body: JSON.stringify({ code: 0, message: 'ไม่พบรูปสลิป' }) };
        }

        const imageBuffer = Buffer.from(imageBase64, 'base64');
        const form = new FormData();
        form.append('files', imageBuffer, {
            filename: 'slip.jpg',
            contentType: mimeType || 'image/jpeg',
            knownLength: imageBuffer.length
        });

        const fetch = require('node-fetch');
        const slipokRes = await fetch(
            `https://api.slipok.com/api/line/apikey/${SLIPOK_BRANCH_ID}`,
            {
                method: 'POST',
                headers: {
                    'x-authorization': SLIPOK_API_KEY,
                    ...form.getHeaders()
                },
                body: form
            }
        );

        const slipData = await slipokRes.json();
        return { statusCode: 200, headers, body: JSON.stringify(slipData) };

    } catch (err) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ code: 0, message: 'เกิดข้อผิดพลาด: ' + err.message })
        };
    }
};
