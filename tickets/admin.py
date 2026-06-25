from django.contrib import admin

from .models import Category, Comment, Ticket, TicketHistory


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "created_at", "updated_at"]
    search_fields = ["name"]


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "title",
        "status",
        "priority",
        "category",
        "created_by",
        "assigned_to",
        "created_at",
        "closed_at",
    ]

    list_filter = [
        "status",
        "priority",
        "category",
        "created_at",
    ]

    search_fields = [
        "title",
        "description",
    ]


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "ticket",
        "author",
        "created_at",
    ]

    search_fields = [
        "content",
    ]


@admin.register(TicketHistory)
class TicketHistoryAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "ticket",
        "actor",
        "from_status",
        "to_status",
        "created_at",
    ]

    list_filter = [
        "to_status",
        "created_at",
    ]
