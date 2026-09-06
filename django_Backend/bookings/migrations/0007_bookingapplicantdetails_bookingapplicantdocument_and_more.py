import bookings.models
import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


def create_missing_applicant_schema(apps, schema_editor):
    """Bring databases with partially-applied applicant migrations to parity."""
    from bookings.models import BookingApplicantDetails, BookingApplicantDocument

    connection = schema_editor.connection
    existing_tables = set(connection.introspection.table_names())

    for model in (BookingApplicantDetails, BookingApplicantDocument):
        if model._meta.db_table not in existing_tables:
            schema_editor.create_model(model)


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0006_remove_legacy_contact_email'),
    ]

    state_operations = [
        migrations.CreateModel(
            name='BookingApplicantDetails',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('contact_name', models.CharField(max_length=255)),
                ('contact_phone', models.CharField(max_length=50)),
                ('contact_email', models.EmailField(max_length=254)),
                ('date_of_birth', models.DateField(blank=True, null=True)),
                ('gender', models.CharField(blank=True, choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')], max_length=50)),
                ('id_type', models.CharField(max_length=50)),
                ('id_number', models.CharField(max_length=255)),
                ('emergency_name', models.CharField(blank=True, max_length=255)),
                ('emergency_phone', models.CharField(blank=True, max_length=50)),
                ('emergency_relationship', models.CharField(blank=True, max_length=100)),
                ('number_of_tenants', models.PositiveIntegerField(default=1, help_text='Number of tenants / guests. 1..100.', validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(100)])),
                ('pickup_time', models.TimeField(blank=True, null=True)),
                ('return_time', models.TimeField(blank=True, null=True)),
                ('pickup_purpose', models.TextField(blank=True)),
                ('information_confirmed', models.BooleanField(default=False)),
                ('terms_accepted', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('booking', models.OneToOneField(help_text='The booking this applicant information belongs to.', on_delete=django.db.models.deletion.CASCADE, related_name='applicant_details', to='bookings.booking')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='BookingApplicantDocument',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('document', models.FileField(upload_to=bookings.models.applicant_document_upload_path)),
                ('document_type', models.CharField(blank=True, max_length=50)),
                ('original_filename', models.CharField(blank=True, max_length=255)),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('applicant_details', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='documents', to='bookings.bookingapplicantdetails')),
            ],
            options={
                'ordering': ['uploaded_at', 'id'],
            },
        ),
        migrations.AddIndex(
            model_name='bookingapplicantdetails',
            index=models.Index(fields=['booking'], name='bookings_bo_booking_a98365_idx'),
        ),
        migrations.AddIndex(
            model_name='bookingapplicantdetails',
            index=models.Index(fields=['contact_email'], name='bookings_bo_contact_a2d347_idx'),
        ),
        migrations.AddIndex(
            model_name='bookingapplicantdocument',
            index=models.Index(fields=['applicant_details', 'uploaded_at'], name='bookings_bo_applica_4676f5_idx'),
        ),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(create_missing_applicant_schema, migrations.RunPython.noop),
            ],
            state_operations=state_operations,
        ),
    ]
