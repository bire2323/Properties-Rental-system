from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [("site_settings", "0005_rename_commission_add_car_vehicle_commission")]

    operations = [
        migrations.AddField(
            model_name="sitesettings",
            name="about_us",
            field=models.TextField(blank=True),
        ),
    ]