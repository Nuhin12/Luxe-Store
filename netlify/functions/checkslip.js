const axios = require('axios');

exports.handler = async (event, context) => {
    // รองรับ CORS สำหรับเรียกใช้งานหน้าบ้าน (Frontend)
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // จัดการ Preflight request (OPTIONS)
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ message: "Method Not Allowed" })
        };
    }

    try {
        const { qrcode } = JSON.parse(event.body);

        if (!qrcode) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: "ไม่พบข้อมูล QR Code จากสลิป" })
            };
        }

        // กำหนดค่า Key และ Branch ID ของ SlipOK ตามที่คุณแจ้งไว้
        const SLIPOK_API_KEY = 'SLIPOKC7O4X5X';
        const SLIPOK_BRANCH_ID = '67047';

        // ยิง Request ไปที่ API ของ SlipOK
        const response = await axios.post('https://api.slipok.com/api/v1/main/log/upload', {
            data: qrcode,
            branchId: SLIPOK_BRANCH_ID
        }, {
            headers: {
                'x-authorization': SLIPOK_API_KEY,
                'Content-Type': 'application/json'
            },
            timeout: 15000 // รอระบบธนาคารสูงสุด 15 วินาที
        });

        const data = response.data;

        // เช็คเงื่อนไขความสำเร็จของ SlipOK (ปกติ SlipOK จะส่ง success: true กลับมาเมื่อสลิปถูกต้อง)
        if (data.success === true || data.status === 200) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    message: "ตรวจสอบสลิปสำเร็จ", 
                    data: data.data 
                })
            };
        } else {
            // ถ้า SlipOK ตอบกลับมาว่าสลิปไม่ถูกต้อง หรือติดปัญหาอื่นๆ
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false,
                    message: data.message || "ตรวจสอบสลิปไม่ผ่าน: ข้อมูลสลิปไม่ถูกต้อง" 
                })
            };
        }

    } catch (error) {
        console.error("Error verifying slip via SlipOK:", error);
        // ในกรณีที่ระบบเชื่อมต่อไปยัง SlipOK ไม่ได้ หรือธนาคารล่มจนเข้า Catch Block
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false,
                message: "ตรวจสอบสลิปไม่ผ่าน: ขออภัยในความไม่สะดวก ขณะนี้ข้อมูลธนาคารเกิดขัดข้องชั่วคราว โปรดตรวจใหม่อีกครั้งใน 15 นาทีถัดไป (ไม่เสียโควต้าสลิป)" 
            })
        };
    }
};
