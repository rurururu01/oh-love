import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { target, message } = await request.json();

    if (!target || !message) {
      return NextResponse.json({ error: 'Missing target or message' }, { status: 400 });
    }

    const token = process.env.FONNTE_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'Fonnte Token is missing in environment variables' }, { status: 500 });
    }

    const formData = new FormData();
    formData.append('target', target);
    formData.append('message', message);
    
    // Opsional: tambahkan delay jika mengirim ke banyak nomor
    // formData.append('delay', '2'); 

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': token, // Menggunakan token langsung tanpa 'Bearer'
      },
      body: formData
    });

    const result = await response.json();

    if (result.status) {
      return NextResponse.json({ success: true, result });
    } else {
      return NextResponse.json({ error: result.reason || 'Failed to send WhatsApp message' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error sending WA:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
