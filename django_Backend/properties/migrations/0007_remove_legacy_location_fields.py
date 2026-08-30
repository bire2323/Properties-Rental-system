from django.db import migrations


class Migration(migrations.Migration):
    """
    Removes the legacy_city and legacy_region text fields from Property and Company
    after the data migration (0006) has already populated the new ForeignKey fields.
    Run this migration only after confirming data has been successfully migrated.
    """

    dependencies = [
        ('properties', '0006_auto_20260830_0542'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='company',
            name='legacy_city',
        ),
        migrations.RemoveField(
            model_name='company',
            name='legacy_region',
        ),
        migrations.RemoveField(
            model_name='property',
            name='legacy_city',
        ),
        migrations.RemoveField(
            model_name='property',
            name='legacy_region',
        ),
    ]
