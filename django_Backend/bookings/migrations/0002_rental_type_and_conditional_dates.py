# Generated manually — rental_type, nullable end_date, conditional date constraints

from django.db import migrations, models


def set_existing_to_fixed_term(apps, schema_editor):
    Booking = apps.get_model("bookings", "Booking")
    Booking.objects.all().update(rental_type="fixed_term")


class Migration(migrations.Migration):

    dependencies = [
        ("bookings", "0001_initial"),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name="booking",
            name="booking_end_after_start",
        ),
        migrations.AddField(
            model_name="booking",
            name="rental_type",
            field=models.CharField(
                choices=[
                    ("fixed_term", "Fixed Term"),
                    ("month_to_month", "Month to Month"),
                ],
                default="fixed_term",
                help_text=(
                    "Agreement type: fixed_term requires start and end dates; "
                    "month_to_month allows an open-ended end date for houses only."
                ),
                max_length=20,
            ),
        ),
        migrations.RunPython(set_existing_to_fixed_term, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="booking",
            name="end_date",
            field=models.DateField(
                blank=True,
                help_text=(
                    "Move-out / return date. Required for fixed-term rentals. "
                    "Must be NULL for month-to-month house rentals."
                ),
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name="booking",
            name="start_date",
            field=models.DateField(help_text="Move-in / pickup date."),
        ),
        migrations.AddConstraint(
            model_name="booking",
            constraint=models.CheckConstraint(
                condition=models.Q(
                    ("rental_type", "fixed_term"),
                    ("end_date__gt", models.F("start_date")),
                )
                | models.Q(
                    ("rental_type", "month_to_month"),
                    ("end_date__isnull", True),
                ),
                name="booking_date_rules_by_rental_type",
            ),
        ),
        migrations.AddIndex(
            model_name="booking",
            index=models.Index(
                fields=["property", "status", "start_date"],
                name="bookings_bo_propert_7a1c2d_idx",
            ),
        ),
    ]
