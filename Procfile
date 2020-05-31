worker: celery -A config worker -B -l info
# web: gunicorn config.wsgi --log-file -
web: daphne config.asgi:application
release: python manage.py migrate