from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import pagination, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from users.permissions import IsAdminOrAgent

from .models import Category, Comment, Ticket, TicketHistory
from .serializers import (
    CategorySerializer,
    CommentSerializer,
    TicketHistorySerializer,
    TicketSerializer,
)


class TicketPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser or request.user.is_staff:
            return True
        return obj.created_by_id == request.user.id


class TicketPagination(pagination.PageNumberPagination):
    page_size = 8
    page_size_query_param = "page_size"
    max_page_size = 50


class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet para listar, criar, visualizar, atualizar e deletar categorias.
    """

    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAdminOrAgent()]
        return [permissions.IsAuthenticated()]


class TicketViewSet(viewsets.ModelViewSet):
    """
    ViewSet para listar, criar, visualizar, atualizar e deletar tickets.
    """

    queryset = Ticket.objects.select_related(
        "category",
        "created_by",
        "assigned_to",
    ).all()

    serializer_class = TicketSerializer
    permission_classes = [TicketPermission]
    pagination_class = TicketPagination

    def get_queryset(self):
        queryset = self.queryset
        user = self.request.user

        if not (user.is_staff or user.is_superuser):
            queryset = queryset.filter(created_by=user)

        search = self.request.query_params.get("search", "").strip()
        status_filter = self.request.query_params.get("status", "").strip()
        priority = self.request.query_params.get("priority", "").strip()
        category = self.request.query_params.get("category", "").strip()
        ordering = self.request.query_params.get("ordering", "-created_at").strip()

        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )

        if status_filter:
            queryset = queryset.filter(status=status_filter)

        if priority:
            queryset = queryset.filter(priority=priority)

        if category:
            queryset = queryset.filter(category_id=category)

        allowed_ordering = {"created_at", "-created_at", "updated_at", "-updated_at"}
        if ordering in allowed_ordering:
            queryset = queryset.order_by(ordering)

        return queryset

    def get_permissions(self):
        if self.action == "destroy":
            return [permissions.IsAdminUser()]
        return [permission() for permission in self.permission_classes]

    @action(detail=True, methods=["get"])
    def history(self, request, pk=None):
        ticket = self.get_object()
        history = TicketHistory.objects.select_related("actor").filter(ticket=ticket)
        serializer = TicketHistorySerializer(history, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"])
    def dashboard(self, request):
        queryset = self.get_queryset()
        by_status = dict(queryset.values_list("status").annotate(total=Count("id")))
        by_priority = dict(queryset.values_list("priority").annotate(total=Count("id")))
        recent = queryset.order_by("-created_at")[:5]

        payload = {
            "total": queryset.count(),
            "open": by_status.get(Ticket.STATUS_OPEN, 0),
            "in_progress": by_status.get(Ticket.STATUS_IN_PROGRESS, 0),
            "resolved": by_status.get(Ticket.STATUS_RESOLVED, 0),
            "closed": by_status.get(Ticket.STATUS_CLOSED, 0),
            "cancelled": by_status.get(Ticket.STATUS_CANCELLED, 0),
            "critical": by_priority.get(Ticket.PRIORITY_CRITICAL, 0),
            "by_status": by_status,
            "by_priority": by_priority,
            "recent": TicketSerializer(recent, many=True, context={"request": request}).data,
        }

        return Response(payload, status=status.HTTP_200_OK)


class TicketCommentListCreateView(APIView):
    """
    View para listar e criar comentarios de um ticket especifico.

    Endpoint:
    GET  /api/tickets/{id}/comments/
    POST /api/tickets/{id}/comments/
    """

    def get(self, request, ticket_id):
        ticket = get_object_or_404(TicketViewSet.queryset, id=ticket_id)
        if not (request.user.is_staff or request.user.is_superuser) and ticket.created_by_id != request.user.id:
            return Response(
                {"detail": "You do not have permission to access this ticket."},
                status=status.HTTP_403_FORBIDDEN,
            )

        comments = Comment.objects.select_related(
            "ticket",
            "author",
        ).filter(ticket=ticket)

        serializer = CommentSerializer(comments, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, ticket_id):
        ticket = get_object_or_404(TicketViewSet.queryset, id=ticket_id)
        if not (request.user.is_staff or request.user.is_superuser) and ticket.created_by_id != request.user.id:
            return Response(
                {"detail": "You do not have permission to access this ticket."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = CommentSerializer(
            data=request.data,
            context={"request": request, "ticket": ticket},
        )

        if serializer.is_valid():
            serializer.save(ticket=ticket)

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )
