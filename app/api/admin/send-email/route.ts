import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, subject, html, text } = body;

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { success: false, message: 'Missing required email fields (to, subject, html or text)' },
        { status: 400 }
      );
    }

    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || `"CampLife Support" <${user || 'support@camplifeadventures.com'}>`;

    const isPlaceholderPass = !pass || pass === 'your_smtp_app_password_here';

    if (isPlaceholderPass) {
      console.log(`[SMTP Email Simulation] To: ${to} | Subject: ${subject} | From: ${from}`);
      return NextResponse.json({
        success: true,
        simulated: true,
        message: `Email dispatched successfully to ${to} (Simulated mode: Update SMTP_PASS in .env for live mail delivery).`
      });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass
      }
    });

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text: text || html.replace(/<[^>]+>/g, ''),
      html: html || text
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      message: `Email sent successfully to ${to}`
    });
  } catch (error: any) {
    console.error('SMTP Email route error:', error);
    return NextResponse.json({
      success: false,
      message: error?.message || 'Failed to dispatch email via SMTP server.'
    }, { status: 500 });
  }
}
