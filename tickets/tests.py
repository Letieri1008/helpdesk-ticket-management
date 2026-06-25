from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import Category, Ticket


User = get_user_model()


class TicketApiTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Access")
        self.customer = User.objects.create_user(
            username="customer@example.com",
            email="customer@example.com",
            password="12345678",
        )
        self.agent = User.objects.create_user(
            username="agent@example.com",
            email="agent@example.com",
            password="12345678",
            is_staff=True,
        )

    def authenticate(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_new_ticket_always_starts_open_and_uses_current_user(self):
        self.authenticate(self.customer)

        response = self.client.post(
            "/api/tickets/",
            {
                "title": "Cannot access ERP",
                "description": "Account is locked.",
                "status": Ticket.STATUS_RESOLVED,
                "priority": Ticket.PRIORITY_HIGH,
                "category": self.category.id,
                "created_by": self.agent.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], Ticket.STATUS_OPEN)
        self.assertEqual(response.data["created_by"], self.customer.id)

    def test_customer_cannot_change_ticket_status(self):
        ticket = Ticket.objects.create(
            title="VPN issue",
            description="VPN fails on login.",
            priority=Ticket.PRIORITY_MEDIUM,
            category=self.category,
            created_by=self.customer,
        )
        self.authenticate(self.customer)

        response = self.client.patch(
            f"/api/tickets/{ticket.id}/",
            {"status": Ticket.STATUS_IN_PROGRESS},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cancelled_ticket_rejects_comments(self):
        ticket = Ticket.objects.create(
            title="Duplicate request",
            description="No action required.",
            status=Ticket.STATUS_CANCELLED,
            priority=Ticket.PRIORITY_LOW,
            category=self.category,
            created_by=self.customer,
        )
        self.authenticate(self.customer)

        response = self.client.post(
            f"/api/tickets/{ticket.id}/comments/",
            {"content": "Adding more context."},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_status_change_creates_history_entry(self):
        ticket = Ticket.objects.create(
            title="Laptop repair",
            description="Battery replacement needed.",
            priority=Ticket.PRIORITY_CRITICAL,
            category=self.category,
            created_by=self.customer,
            assigned_to=self.agent,
        )
        self.authenticate(self.agent)

        response = self.client.patch(
            f"/api/tickets/{ticket.id}/",
            {"status": Ticket.STATUS_IN_PROGRESS},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(ticket.history.count(), 1)
        self.assertEqual(ticket.history.first().to_status, Ticket.STATUS_IN_PROGRESS)

    def test_ticket_list_is_paginated(self):
        for index in range(10):
            Ticket.objects.create(
                title=f"Ticket {index}",
                description="Paginated support request.",
                priority=Ticket.PRIORITY_LOW,
                category=self.category,
                created_by=self.customer,
                assigned_to=self.agent,
            )
        self.authenticate(self.agent)

        response = self.client.get("/api/tickets/", {"page_size": 5})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 10)
        self.assertEqual(len(response.data["results"]), 5)

    def test_agent_can_edit_ticket_details_and_assignee(self):
        second_agent = User.objects.create_user(
            username="second-agent@example.com",
            email="second-agent@example.com",
            password="12345678",
            is_staff=True,
        )
        ticket = Ticket.objects.create(
            title="Old title",
            description="Old description",
            priority=Ticket.PRIORITY_MEDIUM,
            category=self.category,
            created_by=self.customer,
            assigned_to=self.agent,
        )
        self.authenticate(self.agent)

        response = self.client.patch(
            f"/api/tickets/{ticket.id}/",
            {
                "title": "Updated title",
                "description": "Updated description",
                "priority": Ticket.PRIORITY_HIGH,
                "category": self.category.id,
                "assigned_to": second_agent.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Updated title")
        self.assertEqual(response.data["assigned_to"], second_agent.id)
