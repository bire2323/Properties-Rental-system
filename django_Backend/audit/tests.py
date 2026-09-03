"""
Tests for the platform-wide Audit Log system.

Covers:
- The `audit_event` / `audit_system_event` services (actor snapshot, system actor, safety).
- The audit admin API endpoints (list, filter, search, pagination, detail, summary).
- Admin-only authorization enforcement (admin vs tenant vs owner).
- Immutability of audit records (no add / change in Django admin).
- Integration: registration -> USER_REGISTERED (and NO notification).
- Integration: login success/failure -> LOGIN_SUCCESS / LOGIN_FAILED.
- Integration: booking lifecycle generates BOOKING_* audit events.
- Integration: verified payment -> PAYMENT_VERIFIED and admin notification rules.
"""
from datetime import date, timedelta
from decimal import Decimal

from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from accounts.models import Notification, User
from audit.admin import AuditLogAdmin
from audit.models import AuditLog
from audit.services import audit_event, audit_system_event
from bookings.models import Booking
from bookings.services import confirm_booking_from_payment, create_booking
from payments.models import PaymentTransaction
from properties.models import ListingStatus, Property, RentalUnit


def _make_user(email, role):
    return User.objects.create_user(
        email=email,
        password="StrongPass123",
        first_name="Test",
        last_name="User",
        role=role,
    )


def _make_house(owner):
    return Property.objects.create(
        owner=owner,
        property_name="Test House",
        description="A fine test house",
        listing_type="house",
        price=Decimal("1000.00"),
        currency="ETB",
        rental_unit=RentalUnit.MONTHLY,
        status=ListingStatus.ACTIVE,
        is_available=True,
        security_deposit=Decimal("500.00"),
    )


def _make_booking(renter, property_obj):
    return create_booking(
        renter=renter,
        property_id=property_obj.id,
        rental_type=Booking.RentalType.MONTH_TO_MONTH,
        start_date=date.today() + timedelta(days=10),
        end_date=None,
    )


# ---------------------------------------------------------------------------
# Services
# ---------------------------------------------------------------------------

class AuditEventServiceTests(TestCase):
    def test_audit_event_records_actor_snapshot(self):
        user = _make_user("actor@example.com", User.Role.TENANT)
        event = audit_event(
            actor=user,
            action="USER_REGISTERED",
            category=AuditLog.Category.USER,
            target_type="user",
            target_id=user.pk,
            target_display=user.email,
            metadata={"safe": "value"},
        )

        self.assertIsNotNone(event)
        self.assertEqual(event.actor, user)
        self.assertEqual(event.actor_email, user.email)
        self.assertEqual(event.actor_role, User.Role.TENANT)
        self.assertEqual(event.actor_display, f"{user.first_name} {user.last_name}")
        self.assertEqual(event.category, AuditLog.Category.USER)
        self.assertEqual(event.result, AuditLog.Result.SUCCESS)
        self.assertEqual(event.severity, AuditLog.Severity.INFO)
        self.assertEqual(event.target_id, str(user.pk))
        self.assertEqual(event.metadata, {"safe": "value"})

    def test_system_event_uses_system_actor(self):
        event = audit_system_event(
            action="SYSTEM_BOOT",
            category=AuditLog.Category.SYSTEM,
            description="System started up.",
        )

        self.assertIsNotNone(event)
        self.assertIsNone(event.actor)
        self.assertEqual(event.actor_role, "system")
        self.assertEqual(event.actor_display, "System")

    def test_audit_event_never_raises_on_bad_input(self):
        # Passing an invalid category should not raise; the service is defensive.
        event = audit_event(
            actor=None,
            action="BAD_EVENT",
            category="not-a-real-category",
        )
        # It either created a row or swallowed the error; either way no exception.
        self.assertIsNotNone(event)

    def test_audit_events_are_append_only(self):
        user = _make_user("append@example.com", User.Role.OWNER)
        e1 = audit_event(actor=user, action="A", category=AuditLog.Category.USER)
        e2 = audit_event(actor=user, action="B", category=AuditLog.Category.USER)

        self.assertEqual(AuditLog.objects.count(), 2)
        self.assertNotEqual(e1.pk, e2.pk)
        self.assertTrue(e1.pk < e2.pk)


# ---------------------------------------------------------------------------
# Admin API + authorization
# ---------------------------------------------------------------------------

class AuditLogAdminApiTests(TestCase):
    def setUp(self):
        self.admin = _make_user("admin@example.com", User.Role.ADMIN)
        self.admin.is_staff = True
        self.admin.is_superuser = True
        self.admin.save()

        self.tenant = _make_user("tenant@example.com", User.Role.TENANT)
        self.owner = _make_user("owner@example.com", User.Role.OWNER)

        self.admin_client = APIClient()
        self.admin_client.force_authenticate(user=self.admin)

    def test_list_requires_admin(self):
        for user in (self.tenant, self.owner):
            client = APIClient()
            client.force_authenticate(user=user)
            response = client.get("/api/audit/admin/audit-logs/")
            self.assertEqual(response.status_code, 403)

    def test_anonymous_is_denied(self):
        # Anonymous requests are rejected by DRF's default authentication (401)
        # rather than reaching the admin role check.
        response = APIClient().get("/api/audit/admin/audit-logs/")
        self.assertEqual(response.status_code, 401)

    def test_list_returns_events_for_admin(self):
        user = _make_user("target@example.com", User.Role.TENANT)
        audit_event(
            actor=user,
            action="USER_REGISTERED",
            category=AuditLog.Category.USER,
        )
        response = self.admin_client.get("/api/audit/admin/audit-logs/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["total_count"], 1)
        self.assertEqual(response.data["events"][0]["action"], "USER_REGISTERED")

    def test_detail_requires_admin_and_returns_full_payload(self):
        user = _make_user("detail@example.com", User.Role.TENANT)
        event = audit_event(
            actor=user,
            action="PROFILE_UPDATED",
            category=AuditLog.Category.USER,
            target_type="user",
            target_id=user.pk,
            description="Profile updated.",
            reason="chore",
            metadata={"field": "phone"},
        )

        response = self.admin_client.get(f"/api/audit/admin/audit-logs/{event.pk}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["action"], "PROFILE_UPDATED")
        self.assertEqual(response.data["reason"], "chore")
        self.assertIn("metadata", response.data)

        non_admin = APIClient()
        non_admin.force_authenticate(user=self.tenant)
        denied = non_admin.get(f"/api/audit/admin/audit-logs/{event.pk}/")
        self.assertEqual(denied.status_code, 403)

    def test_search_filters_events(self):
        user = _make_user("search@example.com", User.Role.TENANT)
        audit_event(actor=user, action="USER_REGISTERED", category=AuditLog.Category.USER,
                    description="someone registered")
        audit_event(actor=user, action="USER_REGISTERED", category=AuditLog.Category.USER,
                    description="a different record")

        response = self.admin_client.get("/api/audit/admin/audit-logs/", {"search": "someone"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["total_count"], 1)

    def test_category_and_severity_filters(self):
        user = _make_user("filt@example.com", User.Role.TENANT)
        audit_event(actor=user, action="A", category=AuditLog.Category.PAYMENT,
                    severity=AuditLog.Severity.ERROR)
        audit_event(actor=user, action="B", category=AuditLog.Category.USER)

        r1 = self.admin_client.get("/api/audit/admin/audit-logs/", {"category": "payment"})
        self.assertEqual(r1.data["total_count"], 1)

        r2 = self.admin_client.get("/api/audit/admin/audit-logs/", {"severity": "error"})
        self.assertEqual(r2.data["total_count"], 1)

    def test_pagination(self):
        user = _make_user("page@example.com", User.Role.TENANT)
        for i in range(5):
            audit_event(actor=user, action=f"EVENT_{i}", category=AuditLog.Category.USER)

        response = self.admin_client.get(
            "/api/audit/admin/audit-logs/", {"page": 1, "page_size": 2}
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["total_count"], 5)
        self.assertEqual(response.data["total_pages"], 3)
        self.assertEqual(len(response.data["events"]), 2)

    def test_summary_requires_admin(self):
        non_admin = APIClient()
        non_admin.force_authenticate(user=self.tenant)
        response = non_admin.get("/api/audit/admin/audit-logs/summary/")
        self.assertEqual(response.status_code, 403)

    def test_summary_returns_counts_for_admin(self):
        user = _make_user("sum@example.com", User.Role.TENANT)
        audit_event(actor=user, action="USER_REGISTERED", category=AuditLog.Category.USER)

        response = self.admin_client.get("/api/audit/admin/audit-logs/summary/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("events_today", response.data)
        self.assertEqual(response.data["events_today"], 1)

    def test_actions_column_is_derived(self):
        user = _make_user("actions@example.com", User.Role.TENANT)
        audit_event(actor=user, action="USER_REGISTERED", category=AuditLog.Category.USER)
        response = self.admin_client.get("/api/audit/admin/audit-logs/")
        self.assertIn("USER_REGISTERED", response.data["actions"])


class AuditLogImmutabilityTests(TestCase):
    def test_admin_cannot_add_or_change_audit_records(self):
        admin = AuditLogAdmin(AuditLog, None)
        self.assertFalse(admin.has_add_permission(None))
        self.assertFalse(admin.has_change_permission(None))


# ---------------------------------------------------------------------------
# Auth integration
# ---------------------------------------------------------------------------

class AuditRegistrationTests(TestCase):
    def test_registration_creates_audit_event_and_no_notification(self):
        client = APIClient()
        response = client.post(
            "/api/accounts/register/",
            {
                "email": "new@example.com",
                "password": "StrongPass123",
                "confirm_password": "StrongPass123",
                "first_name": "New",
                "last_name": "User",
                "role": User.Role.TENANT,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)

        self.assertTrue(
            AuditLog.objects.filter(
                action="USER_REGISTERED",
                category=AuditLog.Category.USER,
                result=AuditLog.Result.SUCCESS,
            ).exists()
        )
        # Normal registration must NOT create an admin notification.
        self.assertFalse(Notification.objects.exists())


class AuditLoginTests(TestCase):
    def setUp(self):
        self.user = _make_user("login@example.com", User.Role.TENANT)

    def test_successful_login_creates_login_success(self):
        client = APIClient()
        response = client.post(
            "/api/accounts/login/",
            {"email": "login@example.com", "password": "StrongPass123"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            AuditLog.objects.filter(
                action="LOGIN_SUCCESS", category=AuditLog.Category.AUTHENTICATION
            ).exists()
        )

    def test_failed_login_creates_login_failed(self):
        client = APIClient()
        response = client.post(
            "/api/accounts/login/",
            {"email": "login@example.com", "password": "WrongPass123"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertTrue(
            AuditLog.objects.filter(
                action="LOGIN_FAILED",
                category=AuditLog.Category.AUTHENTICATION,
                result=AuditLog.Result.FAILED,
            ).exists()
        )


# ---------------------------------------------------------------------------
# Booking integration
# ---------------------------------------------------------------------------

class AuditBookingTests(TestCase):
    def setUp(self):
        self.owner = _make_user("bok-owner@example.com", User.Role.OWNER)
        self.renter = _make_user("bok-renter@example.com", User.Role.TENANT)
        self.property_obj = _make_house(self.owner)

    def test_creating_booking_records_booking_created(self):
        booking = _make_booking(self.renter, self.property_obj)

        event = AuditLog.objects.filter(
            action="BOOKING_CREATED",
            category=AuditLog.Category.BOOKING,
            target_type="booking",
            target_id=booking.pk,
        ).first()
        self.assertIsNotNone(event)
        self.assertEqual(event.actor, self.renter)
        self.assertEqual(event.target_display, booking.booking_reference)

    def test_confirming_booking_records_payment_verified(self):
        booking = _make_booking(self.renter, self.property_obj)
        booking.status = Booking.BookingStatus.APPROVED
        booking.save(update_fields=["status", "updated_at"])

        payment = PaymentTransaction.objects.create(
            booking=booking,
            payer=self.renter,
            payment_method=PaymentTransaction.PaymentMethod.CASH,
            amount=booking.total_amount,
            currency=booking.currency,
            status=PaymentTransaction.PaymentStatus.SUCCESSFUL,
        )

        confirm_booking_from_payment(payment)

        booking.refresh_from_db()
        self.assertEqual(booking.status, Booking.BookingStatus.CONFIRMED)

        self.assertTrue(
            AuditLog.objects.filter(
                action="PAYMENT_VERIFIED",
                category=AuditLog.Category.PAYMENT,
                result=AuditLog.Result.SUCCESS,
                target_type="payment",
                target_id=payment.pk,
            ).exists()
        )


# ---------------------------------------------------------------------------
# Notification rules (success -> audit only; failure -> notification)
# ---------------------------------------------------------------------------

class AuditNotificationRulesTests(TestCase):
    def test_payment_success_does_not_create_notification(self):
        owner = _make_user("pay-owner@example.com", User.Role.OWNER)
        renter = _make_user("pay-renter@example.com", User.Role.TENANT)
        property_obj = _make_house(owner)
        booking = _make_booking(renter, property_obj)
        booking.status = Booking.BookingStatus.APPROVED
        booking.save(update_fields=["status", "updated_at"])

        payment = PaymentTransaction.objects.create(
            booking=booking,
            payer=renter,
            payment_method=PaymentTransaction.PaymentMethod.CASH,
            amount=booking.total_amount,
            currency=booking.currency,
            status=PaymentTransaction.PaymentStatus.SUCCESSFUL,
        )
        confirm_booking_from_payment(payment)

        # Payment verification is audit-only; no PAYMENT-typed admin
        # notification is created for a successful transaction.
        self.assertFalse(
            Notification.objects.filter(type=Notification.NotificationType.PAYMENT).exists()
        )

    @override_settings(ROOT_URLCONF="config.urls")
    def test_payment_failure_creates_notification_via_signal(self):
        # Simulate a failed payment transaction -> the post_save signal should
        # produce both an AuditLog and an admin Notification.
        owner = _make_user("fail-owner@example.com", User.Role.OWNER)
        renter = _make_user("fail-renter@example.com", User.Role.TENANT)
        property_obj = _make_house(owner)
        booking = _make_booking(renter, property_obj)

        payment = PaymentTransaction.objects.create(
            booking=booking,
            payer=renter,
            payment_method=PaymentTransaction.PaymentMethod.CASH,
            amount=booking.total_amount,
            currency=booking.currency,
            status=PaymentTransaction.PaymentStatus.INITIATED,
        )
        payment.status = PaymentTransaction.PaymentStatus.FAILED
        payment.save(update_fields=["status"])

        self.assertTrue(
            AuditLog.objects.filter(
                action="PAYMENT_FAILED",
                category=AuditLog.Category.PAYMENT,
                result=AuditLog.Result.FAILED,
            ).exists()
        )
        self.assertTrue(
            Notification.objects.filter(
                type=Notification.NotificationType.PAYMENT,
                title="Payment failed",
            ).exists()
        )
