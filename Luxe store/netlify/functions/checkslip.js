const https = require('https');
const FormData = require('form-data');

const SLIPOK_API_KEY = 'SLIPOKM37EF7F';
const SLIPOK_BRANCH_ID = '66986';

exports.handler = async function(event, context) {
    // Allow CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        // รับ base64 รูปสลิปจาก frontend
        const body = JSON.parse(event.body);
        const { imageBase64, mimeType } = body;

        if (!imageBase64) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'ไม่พบข้อมูลรูปสลิป' })
            };
        }

        // แปลง base64 กลับเป็น Buffer
        const imageBuffer = Buffer.from(imageBase64, 'base64');

        // สร้าง FormData ส่งไป SlipOk
        const form = new FormData();
        form.append('files', imageBuffer, {
            filename: 'slip.jpg',
            contentType: mimeType || 'image/jpeg'
        });

        // ส่งไป SlipOk API
        const slipokRes = await fetch(`https://api.slipok.com/api/line/apikey/${SLIPOK_BRANCH_ID}`, {
            method: 'POST',
            headers: {
                'x-authorization': SLIPOK_API_KEY,
                ...form.getHeaders()
            },
            body: form
        });

        const slipData = await slipokRes.json();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(slipData)
        };

    } catch (err) {
        console.error('SlipOk proxy error:', err);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'เกิดข้อผิดพลาดในการตรวจสอบสลิป', detail: err.message })
        };
    }
};
