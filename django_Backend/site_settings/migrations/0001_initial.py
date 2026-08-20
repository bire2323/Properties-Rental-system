from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = []

    operations = [
        migrations.CreateModel(
            name="SiteSettings",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("site_name", models.CharField(max_length=100)),
                ("site_tagline", models.CharField(blank=True, max_length=255)),
                ("description", models.TextField(blank=True)),
                ("contact_phone", models.CharField(blank=True, max_length=30)),
                ("email", models.EmailField(blank=True, max_length=254)),
                ("address", models.CharField(blank=True, max_length=255)),
                ("copyright_text", models.CharField(blank=True, default="© 2026 Property Rental System. All rights reserved.", max_length=255)),
                ("logo", models.ImageField(blank=True, null=True, upload_to="site/logo/")),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
        ),
    ]