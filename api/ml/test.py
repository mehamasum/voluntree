from celery import Celery

celery = Celery('gears')
class Config:
    broker_url = 'redis://localhost:6379'
celery.config_from_object(Config)

def xlog(*args):
    execute('XADD', 'logs2', '*', 'msg', ' '.join(map(str, args)))

def test():
    celery.send_task('voluntree.tasks.add_me', (2, 2))

test()
GearsBuilder().run()
