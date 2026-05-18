import asyncio
import smtplib
from email.message import EmailMessage
from email.utils import make_msgid
from html import escape

from app.core.config import get_settings
from app.core.exceptions import ExternalServiceError
from app.core.logging import get_logger

logger = get_logger(__name__)


class EmailService:
    async def send_otp(self, *, to_email: str, otp: str, expires_minutes: int) -> None:
        settings = get_settings()
        if not settings.smtp_host:
            logger.warning("SMTP is not configured. OTP for %s is %s", to_email, otp)
            return

        message = EmailMessage()
        message["Subject"] = "Your Simplify AI verification code"
        message["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
        message["To"] = to_email
        message["Reply-To"] = settings.smtp_from_email
        message["Message-ID"] = make_msgid(domain=settings.smtp_from_email.split("@")[-1])
        message.set_content(
            f"Your Simplify AI verification code is {otp}. "
            f"It expires in {expires_minutes} minutes."
        )
        message.add_alternative(
            self._otp_template(otp=otp, expires_minutes=expires_minutes),
            subtype="html",
        )

        refused = await asyncio.to_thread(self._send, message)
        if refused:
            logger.error("OTP email recipient refused: %s", refused)
            raise ExternalServiceError(
                "Email provider refused the verification email.",
                service="email",
                details={"refused_recipients": list(refused.keys())},
            )
        logger.info("OTP email accepted by SMTP for %s", to_email)
        if settings.app_env.lower() in {"development", "dev", "local"}:
            logger.info("Development OTP fallback for %s is %s", to_email, otp)

    @staticmethod
    def _send(message: EmailMessage) -> dict[str, tuple[int, bytes]]:
        settings = get_settings()
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as smtp:
            if settings.smtp_use_tls:
                smtp.starttls()
            if settings.smtp_username:
                smtp.login(settings.smtp_username, settings.smtp_password)
            return smtp.send_message(message)

    @staticmethod
    def _otp_template(*, otp: str, expires_minutes: int) -> str:
        safe_otp = escape(otp)
        return f"""
        <!doctype html>
        <html>
          <body style="margin:0;background:#070a12;color:#f8fafc;font-family:Inter,Segoe UI,Arial,sans-serif;">
            <table width="100%" role="presentation" cellspacing="0" cellpadding="0" style="background:#070a12;padding:32px 16px;">
              <tr>
                <td align="center">
                  <table width="100%" role="presentation" cellspacing="0" cellpadding="0" style="max-width:520px;border:1px solid rgba(255,255,255,.12);border-radius:18px;background:#0f172a;">
                    <tr>
                      <td style="padding:32px;">
                        <p style="margin:0 0 12px;color:#93c5fd;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Simplify AI</p>
                        <h1 style="margin:0;color:#fff;font-size:24px;line-height:1.25;">Verify your email</h1>
                        <p style="margin:14px 0 24px;color:#cbd5e1;font-size:15px;line-height:1.6;">Use this one-time code to finish creating your account. It expires in {expires_minutes} minutes.</p>
                        <div style="border-radius:14px;background:#111827;border:1px solid rgba(147,197,253,.25);padding:20px;text-align:center;">
                          <span style="font-size:34px;letter-spacing:.22em;font-weight:800;color:#f8fafc;">{safe_otp}</span>
                        </div>
                        <p style="margin:24px 0 0;color:#94a3b8;font-size:13px;line-height:1.6;">If you did not request this code, you can safely ignore this email.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
        """
