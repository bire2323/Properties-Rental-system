from django.db import migrations


LEGACY_APPLICANT_COLUMNS = {
    "contact_name",
    "contact_phone",
    "contact_email",
    "date_of_birth",
    "gender",
    "id_type",
    "id_number",
    "emergency_name",
    "emergency_phone",
    "emergency_relationship",
    "number_of_tenants",
    "pickup_time",
    "return_time",
    "pickup_purpose",
    "information_confirmed",
    "terms_accepted",
}


def remove_legacy_booking_applicant_fields(apps, schema_editor):
    """Remove applicant fields left behind on bookings by the old schema."""
    table_name = "bookings_booking"
    connection = schema_editor.connection

    with connection.cursor() as cursor:
        columns = {
            column.name
            for column in connection.introspection.get_table_description(cursor, table_name)
        }

    for column_name in sorted(LEGACY_APPLICANT_COLUMNS & columns):
        schema_editor.execute(
            f"ALTER TABLE {schema_editor.quote_name(table_name)} "
            f"DROP COLUMN {schema_editor.quote_name(column_name)}"
        )


class Migration(migrations.Migration):
    dependencies = [
        ("bookings", "0007_bookingapplicantdetails_bookingapplicantdocument_and_more"),
    ]

    operations = [
        migrations.RunPython(remove_legacy_booking_applicant_fields, migrations.RunPython.noop),
    ]