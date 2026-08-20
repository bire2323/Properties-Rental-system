from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):
    dependencies = [("site_settings", "0003_notification_preferences")]

    operations = [
        migrations.AddField(
            model_name="sitesettings",
            name="booking_expiration_hours",
            field=models.PositiveIntegerField(default=24, validators=[django.core.validators.MinValueValidator(1)]),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="owner_commission_percent",
            field=models.DecimalField(decimal_places=2, default=5, max_digits=5, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)]),
        ),
        migrations.CreateModel(
            name="PaymentMethod",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=100)),
                ("account", models.CharField(max_length=100)),
                ("holder", models.CharField(max_length=150)),
                ("logo", models.ImageField(blank=True, null=True, upload_to="site/payment-methods/")),
                ("description", models.TextField(blank=True)),
                ("enabled", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("site_settings", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="payment_methods", to="site_settings.sitesettings")),
            ],
            options={"ordering": ("name", "id")},
        ),
    ]
