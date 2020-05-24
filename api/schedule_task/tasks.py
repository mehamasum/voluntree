import logging
from config.celery import app


@app.task(name="schedule_task.webhook.fetch_comment")
def fetch_comment():
    logging.debug(f"Running comment fetch task")
    return "hello"
