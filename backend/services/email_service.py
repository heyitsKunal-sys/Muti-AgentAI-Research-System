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
):
    result = await brevo_client.transactional_emails.send_transac_email(
        subject="Your Meridian verification code",
        html_content=f"""
        <html>
            <body style="font-family: Arial, sans-serif;">
                <h2>Verify your Meridian account</h2>

                <p>Hello {recipient_name},</p>

                <p>
                    Use the following verification code to
                    complete your Meridian signup:
                </p>

                <h1 style="letter-spacing: 6px;">
                    {otp}
                </h1>

                <p>
                    This code expires in 10 minutes.
                </p>

                <p>
                    If you did not create a Meridian account,
                    you can ignore this email.
                </p>

                <p>
                    — Meridian
                </p>
            </body>
        </html>
        """,
        text_content=(
            f"Hello {recipient_name},\n\n"
            f"Your Meridian verification code is: {otp}\n\n"
            "This code expires in 10 minutes.\n\n"
            "If you did not create a Meridian account, "
            "you can ignore this email.\n\n"
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