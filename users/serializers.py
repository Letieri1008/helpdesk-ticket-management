from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.authtoken.models import Token


User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "name",
            "role",
            "is_staff",
            "is_superuser",
        ]

    def get_name(self, obj):
        full_name = obj.get_full_name().strip()
        return full_name or obj.username

    def get_role(self, obj):
        if obj.is_superuser:
            return "admin"
        if obj.is_staff:
            return "agent"
        return "customer"


class RegisterSerializer(serializers.Serializer):
    ROLE_CUSTOMER = "customer"
    ROLE_AGENT = "agent"

    ROLE_CHOICES = [
        (ROLE_CUSTOMER, "Customer"),
        (ROLE_AGENT, "Agent"),
        ("requester", "Requester"),
        ("employee", "Employee"),
    ]

    name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=ROLE_CHOICES, default=ROLE_CUSTOMER)

    def validate_email(self, value):
        email = value.lower()

        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("A user with this email already exists.")

        return email

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        name = validated_data["name"].strip()
        email = validated_data["email"]
        password = validated_data["password"]
        role = validated_data.get("role", self.ROLE_CUSTOMER)
        role = {"requester": self.ROLE_CUSTOMER, "employee": self.ROLE_AGENT}.get(
            role,
            role,
        )

        name_parts = name.split(maxsplit=1)
        first_name = name_parts[0] if name_parts else ""
        last_name = name_parts[1] if len(name_parts) > 1 else ""

        user = User.objects.create_user(
            username=email,
            email=email,
            first_name=first_name,
            last_name=last_name,
            password=password,
        )
        user.is_staff = role == self.ROLE_AGENT
        user.save(update_fields=["is_staff"])
        return user


class AuthUserSerializer(UserSerializer):
    token = serializers.SerializerMethodField()

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ["token"]

    def get_token(self, obj):
        token, _ = Token.objects.get_or_create(user=obj)
        return token.key


class LoginSerializer(serializers.Serializer):
    username_or_email = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True)
