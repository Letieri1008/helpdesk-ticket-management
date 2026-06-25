from django.urls import path

from .views import LoginAPIView, RegisterAPIView, UserListCreateAPIView


urlpatterns = [
    path("auth/register/", RegisterAPIView.as_view(), name="auth-register"),
    path("auth/login/", LoginAPIView.as_view(), name="auth-login"),
    path("users/", UserListCreateAPIView.as_view(), name="user-list-create"),
]
