# Data migration: populate common property features

from django.db import migrations


DEFAULT_FEATURES = [
    'Wi-Fi',
    'Security',
    'CCTV',
    'Swimming Pool',
    'Garden',
    'Balcony',
    'Air Conditioning',
    'Water Supply',
    'Electricity',
    'Parking',
    'Gym',
    'Elevator',
]


def seed_features(apps, schema_editor):
    Feature = apps.get_model('properties', 'Feature')
    for name in DEFAULT_FEATURES:
        Feature.objects.get_or_create(name=name)


def unseed_features(apps, schema_editor):
    Feature = apps.get_model('properties', 'Feature')
    Feature.objects.filter(name__in=DEFAULT_FEATURES).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('properties', '0003_add_feature_model'),
    ]

    operations = [
        migrations.RunPython(seed_features, unseed_features),
    ]
