from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('properties', '0007_remove_legacy_location_fields'),
    ]

    operations = [
        migrations.AlterField(
            model_name='city',
            name='region',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name='cities',
                to='properties.region',
            ),
        ),
    ]
