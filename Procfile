# web: gunicorn config.wsgi --log-file -
web: bin/start-pgbouncer daphne config.asgi:application --port $PORT --bind 0.0.0.0
worker: bin/start-pgbouncer celery -A config worker -l info
release: python manage.py migrate
