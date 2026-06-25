from rest_framework import serializers

from .models import Category, Comment, Ticket, TicketHistory

class CategorySerializer(serializers.ModelSerializer):
    """
    Serializer responsavel por converter Category em JSON
    e JSON em Category.
    """

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "description",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


class TicketSerializer(serializers.ModelSerializer):
    """
    Serializer responsavel por converter Ticket em JSON
    e JSON em Ticket.
    """

    category_detail = CategorySerializer(source="category", read_only=True)

    created_by_username = serializers.CharField(
        source="created_by.username",
        read_only=True,
    )

    assigned_to_username = serializers.CharField(
        source="assigned_to.username",
        read_only=True,
    )

    created_by_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = [
            "id",
            "title",
            "description",
            "status",
            "priority",
            "category",
            "category_detail",
            "created_by",
            "created_by_username",
            "created_by_name",
            "assigned_to",
            "assigned_to_username",
            "assigned_to_name",
            "created_at",
            "updated_at",
            "closed_at",
        ]

        read_only_fields = [
            "id",
            "created_by",
            "created_at",
            "updated_at",
            "closed_at",
        ]

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name().strip() or obj.created_by.username

    def get_assigned_to_name(self, obj):
        if not obj.assigned_to:
            return ""
        return obj.assigned_to.get_full_name().strip() or obj.assigned_to.username

    def validate(self, attrs):
        request = self.context.get("request")
        user = getattr(request, "user", None)

        if self.instance:
            self._validate_existing_ticket(attrs, user)
        else:
            attrs["status"] = Ticket.STATUS_OPEN
            if user and user.is_authenticated:
                attrs["created_by"] = user
            if user and user.is_authenticated and not (user.is_staff or user.is_superuser):
                attrs.pop("assigned_to", None)

        return attrs

    def _validate_existing_ticket(self, attrs, user):
        next_status = attrs.get("status", self.instance.status)
        status_is_changing = next_status != self.instance.status
        editable_fields = set(attrs.keys()) - {"status", "assigned_to"}

        if self.instance.status == Ticket.STATUS_CLOSED and editable_fields:
            raise serializers.ValidationError(
                "Closed tickets can only receive status or assignment updates."
            )

        if self.instance.status == Ticket.STATUS_CANCELLED:
            raise serializers.ValidationError("Cancelled tickets cannot be edited.")

        if self.instance.status == Ticket.STATUS_RESOLVED and status_is_changing:
            allowed = {Ticket.STATUS_CLOSED, Ticket.STATUS_IN_PROGRESS}
            if next_status not in allowed:
                raise serializers.ValidationError(
                    "Resolved tickets can only be closed or moved back to in progress."
                )

        if user and user.is_authenticated and not (user.is_staff or user.is_superuser):
            forbidden_fields = {"status", "assigned_to", "created_by"} & set(attrs.keys())
            if forbidden_fields:
                raise serializers.ValidationError(
                    "Customers cannot change status, requester or assignee fields."
                )

    def update(self, instance, validated_data):
        previous_status = instance.status
        ticket = super().update(instance, validated_data)
        ticket.mark_closed_timestamp()
        ticket.save(update_fields=["closed_at", "updated_at"])

        if previous_status != ticket.status:
            request = self.context.get("request")
            actor = getattr(request, "user", None)
            TicketHistory.objects.create(
                ticket=ticket,
                actor=actor if actor and actor.is_authenticated else None,
                from_status=previous_status,
                to_status=ticket.status,
            )

        return ticket

    def create(self, validated_data):
        ticket = super().create(validated_data)
        TicketHistory.objects.create(
            ticket=ticket,
            actor=validated_data.get("created_by"),
            from_status="",
            to_status=ticket.status,
            note="Ticket created",
        )
        return ticket


class CommentSerializer(serializers.ModelSerializer):
    """
    Serializer responsavel por converter Comment em JSON
    e JSON em Comment.
    """

    author_username = serializers.CharField(
        source="author.username",
        read_only=True,
    )

    author_name = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            "id",
            "ticket",
            "author",
            "author_username",
            "author_name",
            "content",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "ticket",
            "author",
            "created_at",
            "updated_at",
        ]

    def get_author_name(self, obj):
        return obj.author.get_full_name().strip() or obj.author.username

    def validate(self, attrs):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        ticket = self.context.get("ticket")

        if ticket and ticket.status == Ticket.STATUS_CANCELLED:
            raise serializers.ValidationError("Cancelled tickets cannot receive comments.")

        if ticket and ticket.status == Ticket.STATUS_CLOSED:
            raise serializers.ValidationError("Closed tickets cannot receive new comments.")

        if user and user.is_authenticated:
            attrs["author"] = user

        return attrs


class TicketHistorySerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source="actor.username", read_only=True)
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model = TicketHistory
        fields = [
            "id",
            "ticket",
            "actor",
            "actor_username",
            "actor_name",
            "from_status",
            "to_status",
            "note",
            "created_at",
        ]
        read_only_fields = fields

    def get_actor_name(self, obj):
        if not obj.actor:
            return "System"
        return obj.actor.get_full_name().strip() or obj.actor.username
