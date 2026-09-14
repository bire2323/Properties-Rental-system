from django.db import migrations
import unicodedata


def feature_slug(name):
    value = unicodedata.normalize('NFKD', name or '')
    return ''.join(ch for ch in value if ch.isalnum()).lower()[:100]


def backfill_feature_slugs(apps, schema_editor):
    Feature = apps.get_model('properties', 'Feature')
    Property = apps.get_model('properties', 'Property')
    Through = Property.features.through

    seen = {}
    for feature in Feature.objects.all().order_by('id'):
        slug = feature_slug(feature.name) or 'unnamed'
        survivor = seen.get(slug)
        if survivor is None:
            feature.slug = slug
            feature.save(update_fields=['slug'])
            seen[slug] = feature
        else:
            # Point any property M2M references at the survivor, then drop the duplicate.
            Through.objects.filter(feature_id=feature.pk).update(feature_id=survivor.pk)
            feature.delete()


def uninstall(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('properties', '0014_add_feature_slug'),
    ]

    operations = [
        migrations.RunPython(backfill_feature_slugs, uninstall),
    ]