# Generated manually for Feature model and Property.features M2M

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('properties', '0002_remove_property_main_image'),
    ]

    operations = [
        migrations.CreateModel(
            name='Feature',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(help_text='Display name, e.g. Wi-Fi, Security, Swimming Pool.', max_length=100, unique=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name': 'Feature',
                'verbose_name_plural': 'Features',
                'ordering': ['name'],
            },
        ),
        migrations.AddField(
            model_name='property',
            name='features',
            field=models.ManyToManyField(
                blank=True,
                help_text='Amenities and features available at this property.',
                related_name='properties',
                to='properties.feature',
            ),
        ),
    ]
