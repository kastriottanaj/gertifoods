from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, UserSerializer

User = get_user_model()

# The refresh token rides in an httpOnly cookie instead of the response body, so
# JavaScript (and therefore any XSS) can never read this long-lived credential.
# Scoped to the accounts path so it is only ever sent to the refresh/logout
# endpoints, not on every API request.
REFRESH_COOKIE_NAME = 'refresh_token'
REFRESH_COOKIE_PATH = '/api/accounts/'


def _set_refresh_cookie(response, token):
    response.set_cookie(
        REFRESH_COOKIE_NAME,
        token,
        max_age=int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds()),
        httponly=True,
        secure=not settings.DEBUG,  # mirrors SESSION/CSRF cookie behaviour
        samesite='Lax',
        path=REFRESH_COOKIE_PATH,
    )


def _delete_refresh_cookie(response):
    response.delete_cookie(
        REFRESH_COOKIE_NAME,
        path=REFRESH_COOKIE_PATH,
        samesite='Lax',
    )


class LoginView(TokenObtainPairView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        # Move the refresh token out of the JSON body and into the cookie.
        refresh = response.data.pop('refresh', None)
        if refresh:
            _set_refresh_cookie(response, refresh)
        return response


class CookieTokenRefreshView(TokenRefreshView):
    """Refresh the access token using the refresh token from the httpOnly cookie.

    The client sends no body — the rotated refresh token is written back as a
    fresh cookie and only the new access token is returned in the response.
    """

    def post(self, request, *args, **kwargs):
        refresh = request.COOKIES.get(REFRESH_COOKIE_NAME)
        if not refresh:
            return Response(
                {'detail': 'No refresh token cookie.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        serializer = self.get_serializer(data={'refresh': refresh})
        try:
            serializer.is_valid(raise_exception=True)
        except (InvalidToken, TokenError):
            response = Response(
                {'detail': 'Invalid or expired refresh token.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
            _delete_refresh_cookie(response)
            return response

        data = serializer.validated_data
        response = Response({'access': data['access']}, status=status.HTTP_200_OK)
        # ROTATE_REFRESH_TOKENS is on, so a new refresh token comes back here.
        if data.get('refresh'):
            _set_refresh_cookie(response, data['refresh'])
        return response


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
    """Blacklist the refresh token from the cookie and clear the cookie.

    AllowAny so logout always clears client state even if the access token has
    already expired; the cookie itself is the credential being revoked.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh = request.COOKIES.get(REFRESH_COOKIE_NAME)
        response = Response(status=status.HTTP_205_RESET_CONTENT)
        if refresh:
            try:
                RefreshToken(refresh).blacklist()
            except TokenError:
                pass  # already expired/invalid — clearing the cookie is enough
        _delete_refresh_cookie(response)
        return response
