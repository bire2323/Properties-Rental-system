"""Split features stored as a JSON-array string into individual features.

Bug: multipart property forms sent ``feature_names`` as a single
``JSON.stringify`` part, and the serializer treated that whole string as
one feature name -- so entering wifi / security camera / fence created a
single feature literally named ``["wifi","security camera","fence"]``.

Repair any such rows: create the individual features (slug-deduplicated,
matching ``Feature.save``), relink the properties that used the bogus row,
then delete it. Reverse operation is a no-op because splitting is lossless
for the intended data.
"""

import json
import unicodedata

from django.db import migrations


def _slug(name):
    value = unicodedata.normalize('NFKD', name or '')
    return ''.join(ch for ch in value if ch.isalnum()).lower()[:100]


def split_json_array_feature_names(apps, schema_editor):
    Feature = apps.get_model('properties', 'Feature')

    for feature in Feature.objects.all():
        name = (feature.name or '').strip()
        if not name.startswith('['):
            continue
        try:
            parts = json.loads(name)
        except ValueError:
            continue
        if not isinstance(parts, list):
            continue

        parts = [str(part).strip() for part in parts if str(part).strip()]
        linked_properties = list(feature.properties.all())

        for part in parts:
            slug = _slug(part)
            if not slug:
                continue
            target = Feature.objects.filter(slug=slug).first()
            if target is None:
                target = Feature.objects.create(name=part[:100], slug=slug)
            for prop in linked_properties:
                prop.features.add(target)

        feature.delete()


class Migration(migrations.Migration):

    dependencies = [
        ('properties', '0017_alter_company_logo_and_more'),
    ]

    operations = [
        migrations.RunPython(
            split_json_array_feature_names,
            migrations.RunPython.noop,
        ),
    ]
