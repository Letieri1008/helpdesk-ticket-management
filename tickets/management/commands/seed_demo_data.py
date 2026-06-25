from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from tickets.models import Category, Comment, Ticket

User = get_user_model()


class Command(BaseCommand):
    help = "Populate the database with demo agents, customers, categories, tickets and comments."

    def handle(self, *args, **options):
        admin = self._seed_admin()
        categories = self._seed_categories()
        agents = self._seed_agents()
        customers = self._seed_customers()
        tickets = self._seed_tickets(categories, agents, customers)
        comments_count = self._seed_comments(tickets, agents, customers)

        self.stdout.write(self.style.SUCCESS("Demo data injected successfully."))
        self.stdout.write(
            f"Admin: {admin.username} | Categories: {len(categories)} | Agents: {len(agents)} | "
            f"Customers: {len(customers)} | Tickets: {len(tickets)} | "
            f"Comments: {comments_count}"
        )

    def _seed_admin(self):
        admin, _ = User.objects.get_or_create(
            username="admin",
            defaults={
                "email": "admin@example.com",
                "first_name": "Helpdesk",
                "last_name": "Admin",
                "is_staff": True,
                "is_superuser": True,
            },
        )
        admin.email = "admin@example.com"
        admin.first_name = "Helpdesk"
        admin.last_name = "Admin"
        admin.is_staff = True
        admin.is_superuser = True
        admin.set_password("123")
        admin.save()
        return admin

    def _seed_categories(self):
        category_specs = [
            ("Hardware", "Desktops, notebooks, monitors and peripherals."),
            ("Software", "Applications, ERP, email and internal systems."),
            ("Network", "Internet, Wi-Fi, VPN and shared resources."),
            ("Access", "Passwords, MFA, account unlock and permissions."),
            ("Facilities", "Physical support requests and workplace needs."),
        ]

        categories = []

        for name, description in category_specs:
            category, _ = Category.objects.get_or_create(
                name=name,
                defaults={"description": description},
            )
            if category.description != description:
                category.description = description
                category.save(update_fields=["description"])
            categories.append(category)

        return categories

    def _seed_agents(self):
        agent_specs = [
            ("bruce.wayne@example.com", "Bruce", "Wayne"),
            ("peter.parker@example.com", "Peter", "Parker"),
            ("sung.jinwoo@example.com", "Sung", "Jinwoo"),
            ("harry.potter@example.com", "Harry", "Potter"),
        ]

        agents = []

        for email, first_name, last_name in agent_specs:
            user, _ = User.objects.get_or_create(
                username=email,
                defaults={
                    "email": email,
                    "first_name": first_name,
                    "last_name": last_name,
                    "is_staff": True,
                },
            )
            user.email = email
            user.first_name = first_name
            user.last_name = last_name
            user.is_staff = True
            user.set_password("12345678")
            user.save()
            agents.append(user)

        return agents

    def _seed_customers(self):
        customer_specs = [
            ("john.smith@example.com", "John", "Smith"),
            ("jane.doe@example.com", "Jane", "Doe"),
            ("michael.brown@example.com", "Michael", "Brown"),
            ("emily.johnson@example.com", "Emily", "Johnson"),
            ("lucas.silva@example.com", "Lucas", "Silva"),
            ("ana.costa@example.com", "Ana", "Costa"),
        ]

        customers = []

        for email, first_name, last_name in customer_specs:
            user, _ = User.objects.get_or_create(
                username=email,
                defaults={
                    "email": email,
                    "first_name": first_name,
                    "last_name": last_name,
                    "is_staff": False,
                },
            )
            user.email = email
            user.first_name = first_name
            user.last_name = last_name
            user.is_staff = False
            user.set_password("12345678")
            user.save()
            customers.append(user)

        return customers

    def _seed_tickets(self, categories, agents, customers):
        category_map = {category.name: category for category in categories}
        agent_map = {agent.email: agent for agent in agents}
        customer_map = {customer.email: customer for customer in customers}

        ticket_specs = [
            {
                "title": "VPN access unavailable",
                "description": "Requester cannot connect to corporate VPN after password reset.",
                "status": Ticket.STATUS_OPEN,
                "priority": Ticket.PRIORITY_HIGH,
                "category": category_map["Network"],
                "created_by": customer_map["john.smith@example.com"],
                "assigned_to": agent_map["bruce.wayne@example.com"],
            },
            {
                "title": "CRM login issue",
                "description": "Sales user receives invalid credentials when opening CRM.",
                "status": Ticket.STATUS_IN_PROGRESS,
                "priority": Ticket.PRIORITY_MEDIUM,
                "category": category_map["Software"],
                "created_by": customer_map["jane.doe@example.com"],
                "assigned_to": agent_map["peter.parker@example.com"],
            },
            {
                "title": "Laptop overheating",
                "description": "Notebook fan is too loud and the device shuts down unexpectedly.",
                "status": Ticket.STATUS_RESOLVED,
                "priority": Ticket.PRIORITY_HIGH,
                "category": category_map["Hardware"],
                "created_by": customer_map["michael.brown@example.com"],
                "assigned_to": agent_map["harry.potter@example.com"],
            },
            {
                "title": "Shared folder permissions",
                "description": "Finance team member lost access to the monthly reports folder.",
                "status": Ticket.STATUS_OPEN,
                "priority": Ticket.PRIORITY_LOW,
                "category": category_map["Access"],
                "created_by": customer_map["emily.johnson@example.com"],
                "assigned_to": agent_map["sung.jinwoo@example.com"],
            },
            {
                "title": "Monitor not turning on",
                "description": "Monitor remains black after docking station reconnection.",
                "status": Ticket.STATUS_CLOSED,
                "priority": Ticket.PRIORITY_MEDIUM,
                "category": category_map["Hardware"],
                "created_by": customer_map["lucas.silva@example.com"],
                "assigned_to": agent_map["bruce.wayne@example.com"],
            },
            {
                "title": "New employee onboarding access",
                "description": "Need email, Slack, ERP and drive permissions for a new hire.",
                "status": Ticket.STATUS_IN_PROGRESS,
                "priority": Ticket.PRIORITY_CRITICAL,
                "category": category_map["Access"],
                "created_by": customer_map["ana.costa@example.com"],
                "assigned_to": agent_map["peter.parker@example.com"],
            },
            {
                "title": "Wi-Fi instability on 3rd floor",
                "description": "Connection drops every 10 minutes near the meeting rooms.",
                "status": Ticket.STATUS_OPEN,
                "priority": Ticket.PRIORITY_MEDIUM,
                "category": category_map["Network"],
                "created_by": customer_map["john.smith@example.com"],
                "assigned_to": agent_map["sung.jinwoo@example.com"],
            },
            {
                "title": "Air conditioning maintenance request",
                "description": "Support room air conditioner is not cooling properly.",
                "status": Ticket.STATUS_RESOLVED,
                "priority": Ticket.PRIORITY_LOW,
                "category": category_map["Facilities"],
                "created_by": customer_map["jane.doe@example.com"],
                "assigned_to": agent_map["harry.potter@example.com"],
            },
        ]

        tickets = []

        for spec in ticket_specs:
            ticket, _ = Ticket.objects.get_or_create(
                title=spec["title"],
                created_by=spec["created_by"],
                defaults=spec,
            )

            for field, value in spec.items():
                setattr(ticket, field, value)

            ticket.save()
            tickets.append(ticket)

        return tickets

    def _seed_comments(self, tickets, agents, customers):
        agent_map = {agent.email: agent for agent in agents}
        customer_map = {customer.email: customer for customer in customers}
        ticket_map = {ticket.title: ticket for ticket in tickets}

        comment_specs = [
            (
                "VPN access unavailable",
                agent_map["bruce.wayne@example.com"],
                "Investigating current VPN logs and validating the affected account.",
            ),
            (
                "VPN access unavailable",
                customer_map["john.smith@example.com"],
                "Issue still happens after restarting the device.",
            ),
            (
                "CRM login issue",
                agent_map["peter.parker@example.com"],
                "Password reset sent and SSO provider re-synced.",
            ),
            (
                "Laptop overheating",
                agent_map["harry.potter@example.com"],
                "Thermal cleaning performed and BIOS updated successfully.",
            ),
            (
                "Shared folder permissions",
                agent_map["sung.jinwoo@example.com"],
                "Checking group membership and audit history now.",
            ),
            (
                "New employee onboarding access",
                customer_map["ana.costa@example.com"],
                "Need this completed before tomorrow morning.",
            ),
            (
                "Wi-Fi instability on 3rd floor",
                agent_map["sung.jinwoo@example.com"],
                "Network team scheduled a signal survey for this afternoon.",
            ),
            (
                "Air conditioning maintenance request",
                agent_map["harry.potter@example.com"],
                "Facilities confirmed the compressor replacement and closed the request.",
            ),
        ]

        created_count = 0

        for ticket_title, author, content in comment_specs:
            ticket = ticket_map[ticket_title]
            _, created = Comment.objects.get_or_create(
                ticket=ticket,
                author=author,
                content=content,
            )
            if created:
                created_count += 1

        return created_count
