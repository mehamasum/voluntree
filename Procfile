worker: cd api && celery -A config worker -B -l info
web: cd api && gunicorn config.wsgi --log-file -
