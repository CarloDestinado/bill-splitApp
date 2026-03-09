<!DOCTYPE html>
<html>
<head>
    <title>Verify Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h1 style="color: #2c3e50;">Welcome to Bill Split, {{ $user->first_name }}!</h1>
        
        <p>Thank you for registering. Please verify your email address to complete your registration and start using Bill Split.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <a href="{{ $verificationUrl }}" style="display: inline-block; background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
        </div>
        
        <p>Or copy and paste this link in your browser:</p>
        <p style="background-color: #f8f9fa; padding: 10px; border-radius: 5px; word-break: break-all;">{{ $verificationUrl }}</p>
        
        <p style="color: #7f8c8d; font-size: 14px; margin-top: 30px;">
            If you didn't create this account, please ignore this email.
        </p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        
        <p style="color: #7f8c8d; font-size: 12px;">
            Bill Split Team<br>
            © {{ date('Y') }} Bill Split. All rights reserved.
        </p>
    </div>
</body>
</html>
