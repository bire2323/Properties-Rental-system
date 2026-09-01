from django.db import migrations, models
import django.core.validators
from decimal import Decimal


class Migration(migrations.Migration):

    dependencies = [("site_settings", "0004_payment_settings")]

    operations = [
        migrations.RenameField(
            model_name="sitesettings",
            old_name="owner_commission_percent",
            new_name="house_commission_percent",
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="car_vehicle_commission_percent",
            field=models.DecimalField(
                decimal_places=2,
                default=Decimal('5.00'),
                max_digits=5,
                validators=[
                    django.core.validators.MinValueValidator(0),
                    django.core.validators.MaxValueValidator(100)
                ]
            ),
        ),
    ]
