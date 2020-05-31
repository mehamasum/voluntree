worker: celery -A config worker -B -l info
# web: gunicorn config.wsgi --log-file -
web: daphne config.asgi:application --port $PORT --bind 0.0.0.0
release: python manage.py migrate