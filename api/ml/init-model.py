import redis
from urllib.parse import urlparse

if __name__ == '__main__':
    # Setup
    # cd api/ml && python init.py

    # Set up Redis connection
    REDIS_URL = 'redis://127.0.0.1:6379'
    url = urlparse(REDIS_URL)
    conn = redis.Redis(host=url.hostname, port=url.port)
    if not conn.ping():
        raise Exception('Redis unavailable')

    print("Connected to", REDIS_URL)

    # Load the RedisAI model
    print('Setting up model')
    with open('model.graph.pb', 'rb') as f:
        model = f.read()
        res = conn.execute_command('AI.MODELSET', 'model:interestnet' , 'TF', 'CPU', 'INPUTS', 'x', 'OUTPUTS', 'Identity', "BLOB", model)
        print(res)
