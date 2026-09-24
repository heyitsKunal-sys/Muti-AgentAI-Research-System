from brevo import AsyncBrevo
from brevo.transactional_emails import (
    SendTransacEmailRequestSender,
    SendTransacEmailRequestToItem,
)

from backend.config import (
    BREVO_API_KEY,
    BREVO_SENDER_EMAIL,
    BREVO_SENDER_NAME,
)


brevo_client = AsyncBrevo(
    api_key=BREVO_API_KEY
)


async def send_otp_email(
    recipient_email: str,
    recipient_name: str,
    otp: str,
    purpose: str = "verification",
):
    is_password_reset = purpose == "password_reset"
    subject = (
        "Reset your Meridian password"
        if is_password_reset
        else "Your Meridian verification code"
    )
    heading = (
        "Reset your Meridian password"
        if is_password_reset
        else "Verify your Meridian account"
    )
    description = (
        "Use the following code to reset your Meridian password:"
        if is_password_reset
        else "Use the following verification code to complete your Meridian signup:"
    )
    safety_message = (
        "If you did not request a password reset, you can ignore this email."
        if is_password_reset
        else "If you did not create a Meridian account, you can ignore this email."
    )

    result = await brevo_client.transactional_emails.send_transac_email(
        subject=subject,
        html_content=f"""
        <html>
            <body style="font-family: Arial, sans-serif;">
                <h2>{heading}</h2>

                <p>Hello {recipient_name},</p>

                <p>{description}</p>

                <h1 style="letter-spacing: 6px;">
                    {otp}
                </h1>

                <p>
                    This code expires in 10 minutes.
                </p>

                <p>
                    {safety_message}
                </p>

                <p>
                    — Meridian
                </p>
            </body>
        </html>
        """,
        text_content=(
            f"Hello {recipient_name},\n\n"
            f"Your Meridian code is: {otp}\n\n"
            "This code expires in 10 minutes.\n\n"
            f"{safety_message}\n\n"
            "— Meridian"
        ),
        sender=SendTransacEmailRequestSender(
            email=BREVO_SENDER_EMAIL,
            name=BREVO_SENDER_NAME,
        ),
        to=[
            SendTransacEmailRequestToItem(
                email=recipient_email,
                name=recipient_name,
            )
        ],
    )

    return result