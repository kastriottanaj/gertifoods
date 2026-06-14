from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, UserSerializer

User = get_user_model()


class LoginView(TokenObtainPairView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'register'


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class LogoutView(APIView):
    """Blacklist the refresh token so logout actually revokes the session."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh = request.data.get('refresh')
        if not refresh:
            return Response(
                {'detail': 'Refresh token is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            RefreshToken(refresh).blacklist()
        except TokenError:
            return Response(
                {'detail': 'Invalid or expired refresh token.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_205_RESET_CONTENT)
