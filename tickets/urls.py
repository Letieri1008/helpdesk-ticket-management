from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CategoryViewSet,
    TicketCommentListCreateView,
    TicketViewSet,
)

router = DefaultRouter()

router.register(r"tickets", TicketViewSet, basename="ticket")
router.register(r"categories", CategoryViewSet, basename="category")

urlpatterns = [
    path("", include(router.urls)),
    path(
        "tickets/<int:ticket_id>/comments/",
        TicketCommentListCreateView.as_view(),
        name="ticket-comments",
    ),
]
