import redis
from urllib.parse import urlparse
import argparse

if __name__ == '__main__':
    # Parse arguments
    parser = argparse.ArgumentParser()
    parser.add_argument('-u', '--url', help='Redis URL', type=str, default='redis://127.0.0.1:6379')
    args = parser.parse_args()

    # Set up Redis connection
    url = urlparse(args.url)
    conn = redis.Redis(host=url.hostname, port=url.port)
    if not conn.ping():
        raise Exception('Redis unavailable')

    print("Connected to", url)

    # Load the RedisAI model
    print('Setting up model')
    with open('model.graph.pb', 'rb') as f:
        model = f.read()
        res = conn.execute_command('AI.MODELSET', 'model:interestnet' , 'TF', 'CPU', 'INPUTS', 'x', 'OUTPUTS', 'Identity', "BLOB", model)
        print(res)
