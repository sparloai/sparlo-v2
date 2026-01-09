import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') as string;
const HOOK_SECRET = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string;
const SITE_URL = Deno.env.get('SITE_URL') || 'https://sparlo.ai';
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'Sparlo <noreply@sparlo.ai>';

interface AuthEmailPayload {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
    token_new?: string;
    token_hash_new?: string;
  };
}

type EmailActionType =
  | 'signup'
  | 'recovery'
  | 'invite'
  | 'magiclink'
  | 'email_change'
  | 'email_change_new';

function getEmailContent(
  actionType: EmailActionType,
  data: AuthEmailPayload,
): { subject: string; html: string } {
  const { user, email_data } = data;
  const userName = user.user_metadata?.full_name || 'there';

  // Build confirmation URL
  const confirmUrl = `${SITE_URL}/auth/confirm?token_hash=${email_data.token_hash}&type=${actionType === 'recovery' ? 'recovery' : actionType}&next=${encodeURIComponent(email_data.redirect_to || SITE_URL)}`;

  // Use direct static URL for logo - NOT /_next/image which doesn't work in emails
  const logoUrl = 'https://sparlo.ai/images/sparlo-logo-white.png';

  const baseStyles = `
    body { background-color: #18181b; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .logo { text-align: center; margin-bottom: 32px; }
    .logo img { max-width: 120px; height: auto; }
    .content { text-align: center; }
    h1 { color: #ffffff; font-size: 28px; font-weight: 600; margin: 0 0 16px 0; line-height: 1.3; }
    p { color: #a1a1aa; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0; }
    .button { display: inline-block; background: #ffffff; color: #18181b !important; text-align: center; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px; }
    .footer { font-size: 12px; color: #52525b; margin-top: 48px; text-align: center; }
    .note { color: #71717a; font-size: 14px; line-height: 1.5; margin: 0; }
    .code { font-size: 32px; font-weight: 700; letter-spacing: 4px; text-align: center; padding: 20px; background: #27272a; border-radius: 8px; margin: 24px 0; color: #ffffff; }
  `;

  switch (actionType) {
    case 'signup':
      return {
        subject: 'Confirm your Sparlo account',
        html: `
          <!DOCTYPE html>
          <html><head><style>${baseStyles}</style></head>
          <body>
            <div class="container">
              <div class="logo"><img src="${logoUrl}" alt="Sparlo" /></div>
              <div class="content">
                <h1>Welcome to Sparlo</h1>
                <p>Hi ${userName}, thanks for signing up! Please confirm your email address to get started.</p>
                <a href="${confirmUrl}" class="button">Confirm Email</a>
                <p class="note" style="margin-top: 24px;">Or use this code: <strong style="color: #ffffff;">${email_data.token}</strong></p>
              </div>
              <p class="footer">Sparlo</p>
            </div>
          </body>
          </html>
        `,
      };

    case 'recovery':
      return {
        subject: 'Reset your Sparlo password',
        html: `
          <!DOCTYPE html>
          <html><head><style>${baseStyles}</style></head>
          <body>
            <div class="container">
              <div class="logo"><img src="${logoUrl}" alt="Sparlo" /></div>
              <div class="content">
                <h1>Reset Your Password</h1>
                <p>We received a request to reset your password. Click the button below to choose a new one.</p>
                <a href="${SITE_URL}/auth/confirm?token_hash=${email_data.token_hash}&type=recovery&next=${SITE_URL}/update-password" class="button">Reset Password</a>
                <p class="note" style="margin-top: 24px;">If you didn't request this, you can safely ignore this email.</p>
              </div>
              <p class="footer">Sparlo</p>
            </div>
          </body>
          </html>
        `,
      };

    case 'magiclink':
      return {
        subject: 'Sign in to Sparlo',
        html: `
          <!DOCTYPE html>
          <html><head><style>${baseStyles}</style></head>
          <body>
            <div class="container">
              <div class="logo"><img src="${logoUrl}" alt="Sparlo" /></div>
              <div class="content">
                <h1>Sign in to Sparlo</h1>
                <p>Click the button below to sign in to your account.</p>
                <a href="${confirmUrl}" class="button">Sign In</a>
                <p class="note" style="margin-top: 24px;">This link expires in 1 hour.</p>
              </div>
              <p class="footer">Sparlo</p>
            </div>
          </body>
          </html>
        `,
      };

    case 'invite':
      return {
        subject: "You've been invited to Sparlo",
        html: `
          <!DOCTYPE html>
          <html><head><style>${baseStyles}</style></head>
          <body>
            <div class="container">
              <div class="logo"><img src="${logoUrl}" alt="Sparlo" /></div>
              <div class="content">
                <h1>You're Invited!</h1>
                <p>You've been invited to join a team on Sparlo. Click the button below to accept the invitation and set up your account.</p>
                <a href="${confirmUrl}" class="button">Accept Invitation</a>
              </div>
              <p class="footer">Sparlo</p>
            </div>
          </body>
          </html>
        `,
      };

    case 'email_change':
      return {
        subject: 'Confirm your email change',
        html: `
          <!DOCTYPE html>
          <html><head><style>${baseStyles}</style></head>
          <body>
            <div class="container">
              <div class="logo"><img src="${logoUrl}" alt="Sparlo" /></div>
              <div class="content">
                <h1>Confirm Email Change</h1>
                <p>We received a request to change your email address. Click the button below to confirm this change.</p>
                <a href="${confirmUrl}" class="button">Confirm Change</a>
                <p class="note" style="margin-top: 24px;">If you didn't request this, please secure your account immediately.</p>
              </div>
              <p class="footer">Sparlo</p>
            </div>
          </body>
          </html>
        `,
      };

    default:
      return {
        subject: 'Your Sparlo verification code',
        html: `
          <!DOCTYPE html>
          <html><head><style>${baseStyles}</style></head>
          <body>
            <div class="container">
              <div class="logo"><img src="${logoUrl}" alt="Sparlo" /></div>
              <div class="content">
                <h1>Verification Code</h1>
                <p>Use the code below to verify your action:</p>
                <div class="code">${email_data.token}</div>
                <p class="note">This code expires in 1 hour.</p>
              </div>
              <p class="footer">Sparlo</p>
            </div>
          </body>
          </html>
        `,
      };
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);

  // Verify webhook signature
  const wh = new Webhook(HOOK_SECRET.replace('v1,whsec_', ''));

  let data: AuthEmailPayload;
  try {
    data = wh.verify(payload, headers) as AuthEmailPayload;
  } catch (error) {
    console.error('Webhook verification failed:', error);
    return new Response(
      JSON.stringify({ error: { message: 'Invalid signature' } }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const actionType = data.email_data.email_action_type as EmailActionType;
  const { subject, html } = getEmailContent(actionType, data);

  // Send via Resend API
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [data.user.email],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error('Resend API error:', error);
      return new Response(
        JSON.stringify({ error: { message: 'Failed to send email' } }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const result = await res.json();
    console.log('Email sent successfully:', result.id);

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(JSON.stringify({ error: { message: error.message } }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
