"""
Email service for sending verification emails using Gmail SMTP.
Supports both direct SMTP and fallback methods for restricted environments.
"""
import os
import secrets
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import aiosmtplib
import smtplib
from config import settings


class EmailService:
    """Service for sending emails via Gmail SMTP with fallback options"""
    
    def __init__(self):
        self.smtp_host = "smtp.gmail.com"
        self.smtp_port_tls = 587  # TLS
        self.smtp_port_ssl = 465  # SSL
        self.sender_email = settings.GMAIL_USER
        self.sender_password = settings.GMAIL_APP_PASSWORD
        self.verification_tokens = {}  # In production, use Redis or database
    
    def generate_verification_token(self, email: str) -> str:
        """Generate a unique verification token for an email"""
        token = secrets.token_urlsafe(32)
        self.verification_tokens[token] = {
            'email': email,
            'expires_at': datetime.now() + timedelta(hours=24)
        }
        return token
    
    def verify_token(self, token: str) -> str | None:
        """Verify a token and return the associated email if valid"""
        token_data = self.verification_tokens.get(token)
        if not token_data:
            return None
        
        if datetime.now() > token_data['expires_at']:
            del self.verification_tokens[token]
            return None
        
        return token_data['email']
    
    def invalidate_token(self, token: str):
        """Remove a token after successful verification"""
        if token in self.verification_tokens:
            del self.verification_tokens[token]
    
    async def send_verification_email(self, to_email: str, verification_url: str):
        """Send email verification link with multiple fallback methods"""
        subject = "Verify Your UniFind Account"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to UniFind!</h1>
                </div>
                <div class="content">
                    <p>Hi there,</p>
                    <p>Thank you for signing up for UniFind! Please verify your email address to complete your registration.</p>
                    <p style="text-align: center;">
                        <a href="{verification_url}" class="button">Verify Email Address</a>
                    </p>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #667eea;">{verification_url}</p>
                    <p>This link will expire in 24 hours.</p>
                    <p>If you didn't create an account with UniFind, please ignore this email.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 UniFind. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Try multiple methods in order
        methods = [
            ("SSL (Port 465)", self._send_email_ssl),
            ("TLS (Port 587)", self._send_email_tls),
            ("Synchronous SSL", self._send_email_sync_ssl),
        ]
        
        last_error = None
        for method_name, method in methods:
            try:
                await method(to_email, subject, html_content)
                print(f"✓ Email sent successfully using {method_name}")
                return
            except Exception as e:
                last_error = e
                print(f"✗ {method_name} failed: {str(e)}")
                continue
        
        # All methods failed
        raise Exception(f"All email methods failed. Last error: {str(last_error)}")
    
    async def _send_email_ssl(self, to_email: str, subject: str, html_content: str):
        """Send email using SSL on port 465 (async)"""
        message = self._create_message(to_email, subject, html_content)
        
        await aiosmtplib.send(
            message,
            hostname=self.smtp_host,
            port=self.smtp_port_ssl,
            use_tls=True,  # Use SSL
            username=self.sender_email,
            password=self.sender_password,
            timeout=30,
        )
    
    async def _send_email_tls(self, to_email: str, subject: str, html_content: str):
        """Send email using STARTTLS on port 587 (async)"""
        message = self._create_message(to_email, subject, html_content)
        
        await aiosmtplib.send(
            message,
            hostname=self.smtp_host,
            port=self.smtp_port_tls,
            start_tls=True,
            username=self.sender_email,
            password=self.sender_password,
            timeout=30,
        )
    
    async def _send_email_sync_ssl(self, to_email: str, subject: str, html_content: str):
        """Send email using synchronous smtplib with SSL (fallback)"""
        import asyncio
        
        def send_sync():
            message = self._create_message(to_email, subject, html_content)
            
            # Use SSL connection
            with smtplib.SMTP_SSL(self.smtp_host, self.smtp_port_ssl, timeout=30) as server:
                server.login(self.sender_email, self.sender_password)
                server.send_message(message)
        
        # Run synchronous code in thread pool
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, send_sync)
    
    def _create_message(self, to_email: str, subject: str, html_content: str) -> MIMEMultipart:
        """Create email message"""
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = self.sender_email
        message["To"] = to_email
        
        html_part = MIMEText(html_content, "html")
        message.attach(html_part)
        
        return message


# Singleton instance
email_service = EmailService()
