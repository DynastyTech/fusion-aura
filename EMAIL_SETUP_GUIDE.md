# Email Setup Guide for Order Notifications

## Current Status

The email notification system is implemented but requires SMTP configuration to send emails.

## Quick Setup

### Option 1: Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "FusionAura" as the name
   - Copy the 16-character password

3. **Add to `.env` file**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
ADMIN_EMAIL=lraseemela@gmail.com
```

4. **Restart the API server**:
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Option 2: Other SMTP Providers

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
ADMIN_EMAIL=lraseemela@gmail.com
```

#### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
ADMIN_EMAIL=lraseemela@gmail.com
```

#### AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-aws-access-key
SMTP_PASS=your-aws-secret-key
ADMIN_EMAIL=lraseemela@gmail.com
```

## Testing Email

After configuring SMTP, test by placing a test order. You should see in the API logs:

```
✅ Email sent successfully to lraseemela@gmail.com
```

If email fails, check the API logs for error messages.

## Troubleshooting

### "Email not configured" message
- Make sure all SMTP variables are set in `.env`
- Restart the API server after adding variables
- Check that there are no typos in variable names

### "Authentication failed"
- For Gmail: Make sure you're using an App Password, not your regular password
- Check that 2FA is enabled on Gmail
- Verify SMTP credentials are correct

### "Connection timeout"
- Check your firewall/network settings
- Verify SMTP host and port are correct
- Some networks block SMTP ports (587, 465)

## Current Behavior

- **If SMTP is configured**: Emails are sent to `lraseemela@gmail.com` when orders are placed
- **If SMTP is NOT configured**: Order details are logged to console instead (order still succeeds)

## Email Content

The admin receives an email with:
- Order number
- Customer information (name, email, phone)
- Order items (product, quantity, price)
- Subtotal, VAT, Total
- Delivery address
- Payment method (Cash on Delivery)

## Production Recommendations

For production, consider:
1. **Dedicated email service** (SendGrid, Mailgun, AWS SES)
2. **Email templates** (using a service like SendGrid or Mailgun)
3. **Email queue** (for reliability)
4. **Retry logic** (for failed sends)
5. **Email logging** (track all sent emails)

