const SLIPOK_API_KEY = 'SLIPOKC7O4X5X';
const SLIPOK_BRANCH_ID = '67047';

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
        const boundary = '----SlipBoundary' + Date.now();

        const partHeader = Buffer.from(
            `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="slip.jpg"\r\nContent-Type: ${mimeType || 'image/jpeg'}\r\n\r\n`,
            'utf8'
        );
        const partFooter = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
        const formBody = Buffer.concat([partHeader, imageBuffer, partFooter]);

        const response = await fetch(
            `https://api.slipok.com/api/line/apikey/${SLIPOK_BRANCH_ID}`,
            {
                method: 'POST',
                headers: {
                    'x-authorization': SLIPOK_API_KEY,
                    'Content-Type': `multipart/form-data; boundary=${boundary}`
                },
                body: formBody
            }
        );

        const slipData = await response.json();
        console.log('SlipOk:', JSON.stringify(slipData));

        return { statusCode: 200, headers, body: JSON.stringify(slipData) };

    } catch (err) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ code: 0, message: 'เกิดข้อผิดพลาด: ' + err.message })
        };
    }
};
