from django.test import RequestFactory, TestCase

from .permissions import CookieJWTAuthentication


class CookieJWTAuthenticationTests(TestCase):
    def test_invalid_cookie_returns_none_instead_of_raising(self):
        factory = RequestFactory()
        request = factory.get('/api/accounts/google/')
        request.COOKIES = {'access_token': 'not-a-valid-jwt'}

        auth = CookieJWTAuthentication()

        self.assertIsNone(auth.authenticate(request))
