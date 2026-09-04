"""A fake email backend used to prove email failures never break booking flow."""
from django.core.mail.backends.base import BaseEmailBackend


class FailingEmailBackend(BaseEmailBackend):
    def send_messages(self, email_messages):
        raise RuntimeError("simulated SMTP failure")
