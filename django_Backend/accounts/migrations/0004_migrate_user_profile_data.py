from django.db import migrations


def copy_user_data_to_profile(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    Profile = apps.get_model("accounts", "Profile")

    for user in User.objects.all().iterator():
        Profile.objects.get_or_create(
            user=user,
            defaults={
                "phone_number": user.phone_number,
                "profile_image": user.profile_image,
                "date_of_birth": user.date_of_birth,
                "address": user.address,
                "city": user.city,
                "country": user.country,
            },
        )


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0003_alter_user_role_ownerprofile_and_more"),
    ]

    operations = [
        migrations.RunPython(
            copy_user_data_to_profile,
            migrations.RunPython.noop,
        ),
    ]
