from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("site_settings", "0002_sitesettings_login_attempts_limit_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="sitesettings",
            name="new_user_registration",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="property_listing_alerts",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="payment_notifications",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="user_report_alerts",
            field=models.BooleanField(default=True),
        ),
    ]