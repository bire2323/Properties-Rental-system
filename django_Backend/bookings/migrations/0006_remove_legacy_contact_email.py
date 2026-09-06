from django.db import migrations


def remove_legacy_contact_email_column(apps, schema_editor):
    """Remove the pre-applicant-details column from databases that still have it."""
    table_name = "bookings_booking"
    with schema_editor.connection.cursor() as cursor:
        columns = {
            column.name
            for column in schema_editor.connection.introspection.get_table_description(
                cursor,
                table_name,
            )
        }

    if "contact_email" in columns:
        quoted_table = schema_editor.quote_name(table_name)
        quoted_column = schema_editor.quote_name("contact_email")
        schema_editor.execute(f"ALTER TABLE {quoted_table} DROP COLUMN {quoted_column}")


class Migration(migrations.Migration):
    dependencies = [
        ("bookings", "0005_bookingauditevent"),
    ]

    operations = [
        migrations.RunPython(remove_legacy_contact_email_column, migrations.RunPython.noop),
    ]