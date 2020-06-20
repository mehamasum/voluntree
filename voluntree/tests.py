from django.test import TestCase
from .models import SignUp
from .services import SignUpService

signup_id = SignUp.objects.first()
print(SignUpService.get_human_readable_version(signup_id))
