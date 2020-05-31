from django.shortcuts import render
from rest_framework.views import APIView

def react(request):
    return render(request, "index.html")
