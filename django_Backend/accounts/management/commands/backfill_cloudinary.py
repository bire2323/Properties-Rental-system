import logging
from pathlib import Path

import cloudinary.uploader
from cloudinary import CloudinaryResource
from cloudinary.models import CloudinaryField
from django.apps import apps
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from config.cloudinary_helpers import legacy_media_path


logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = (
        "Upload legacy /media/ files referenced by CloudinaryFields and update "
        "their database references without deleting local files."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report legacy references without uploading or updating them.",
        )
        parser.add_argument(
            "--app",
            dest="app_label",
            help="Limit the scan to one installed Django app label.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            help="Stop after processing this many legacy references.",
        )

    def handle(self, *args, **options):
        app_label = options["app_label"]
        dry_run = options["dry_run"]
        limit = options["limit"]
        if limit is not None and limit < 1:
            raise CommandError("--limit must be a positive integer.")
        if app_label and not any(
            config.label == app_label for config in apps.get_app_configs()
        ):
            raise CommandError(f"Unknown installed app label: {app_label}")

        media_root = Path(settings.MEDIA_ROOT).resolve()
        processed = failed = 0
        for model in apps.get_models():
            if app_label and model._meta.app_label != app_label:
                continue
            for field in model._meta.concrete_fields:
                if not isinstance(field, CloudinaryField):
                    continue
                queryset = model._base_manager.all().order_by("pk")
                for instance in queryset.iterator():
                    value = getattr(instance, field.attname, None)
                    legacy_path = legacy_media_path(value)
                    if not legacy_path:
                        continue
                    if limit is not None and processed >= limit:
                        self.stdout.write(
                            self.style.WARNING(
                                f"Reached --limit={limit}; stopping scan."
                            )
                        )
                        self._write_summary(processed, failed, dry_run)
                        return

                    processed += 1
                    source = (media_root / legacy_path.removeprefix("/media/")).resolve()
                    try:
                        source.relative_to(media_root)
                    except ValueError:
                        failed += 1
                        logger.error(
                            "Refusing legacy media path outside MEDIA_ROOT: %s",
                            legacy_path,
                        )
                        continue

                    if not source.is_file():
                        failed += 1
                        logger.error(
                            "Legacy media file is missing for %s.%s pk=%s: %s",
                            model._meta.label,
                            field.name,
                            instance.pk,
                            source,
                        )
                        continue

                    if dry_run:
                        self.stdout.write(
                            f"Would upload {model._meta.label}.{field.name} "
                            f"pk={instance.pk}: {source}"
                        )
                        continue

                    try:
                        self._backfill_instance(
                            model=model,
                            instance=instance,
                            field=field,
                            source=source,
                        )
                    except Exception:
                        failed += 1

        self._write_summary(processed, failed, dry_run)
        if failed:
            raise CommandError(
                f"Backfill completed with {failed} failed reference(s); "
                "see the log for details."
            )

    def _backfill_instance(self, *, model, instance, field, source):
        folder_option = field.options.get("folder")
        folder = (
            folder_option(instance)
            if callable(folder_option)
            else folder_option
        ) or (
            f"getspace/legacy/{model._meta.app_label}/"
            f"{model._meta.model_name}/{field.name}"
        )
        resource_type = field.resource_type or "image"
        delivery_type = field.type or "upload"
        public_id = (
            f"{model._meta.app_label}_{model._meta.model_name}_"
            f"{instance.pk}_{field.name}_{source.stem}"
        )
        uploaded = None
        try:
            uploaded = cloudinary.uploader.upload(
                str(source),
                resource_type=resource_type,
                type=delivery_type,
                folder=folder,
                public_id=public_id,
                overwrite=False,
                use_filename=False,
            )
            resource = CloudinaryResource(
                public_id=uploaded["public_id"],
                version=uploaded.get("version"),
                format=uploaded.get("format"),
                type=uploaded.get("type", delivery_type),
                resource_type=uploaded.get("resource_type", resource_type),
            )
            setattr(instance, field.attname, resource)
            instance.save(update_fields=[field.name])
        except Exception:
            logger.exception(
                "Cloudinary backfill failed for %s.%s pk=%s (%s)",
                model._meta.label,
                field.name,
                instance.pk,
                source,
            )
            if uploaded and uploaded.get("public_id"):
                try:
                    cloudinary.uploader.destroy(
                        uploaded["public_id"],
                        resource_type=uploaded.get("resource_type", resource_type),
                        type=uploaded.get("type", delivery_type),
                        invalidate=True,
                    )
                except Exception:
                    logger.exception(
                        "Could not clean up failed backfill upload %s",
                        uploaded["public_id"],
                    )
            raise
        else:
            logger.info(
                "Backfilled %s.%s pk=%s from %s to Cloudinary asset %s",
                model._meta.label,
                field.name,
                instance.pk,
                source,
                uploaded["public_id"],
            )
            self.stdout.write(
                f"Uploaded {model._meta.label}.{field.name} pk={instance.pk}"
            )

    def _write_summary(self, processed, failed, dry_run):
        mode = "Dry run" if dry_run else "Backfill"
        self.stdout.write(
            self.style.SUCCESS(
                f"{mode}: scanned {processed} legacy reference(s); "
                f"{failed} missing/invalid reference(s). Local files were retained."
            )
        )
