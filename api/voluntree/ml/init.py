import redis
from urllib.parse import urlparse

if __name__ == '__main__':
    # Setup
    # cd api/voluntree/ml && python api/voluntree/ml/init.py

    # Set up Redis connection
    url = urlparse('redis://127.0.0.1:6379')
    conn = redis.Redis(host=url.hostname, port=url.port)
    if not conn.ping():
        raise Exception('Redis unavailable')
    
    
    # Load the RedisAI model
    print('Setting up model')    
    with open('model.graph.pb', 'rb') as f:
        model = f.read()
        res = conn.execute_command('AI.MODELSET', 'model:interestnet' , 'TF', 'CPU', 'INPUTS', 'x', 'OUTPUTS', 'Identity', 'BLOB', model)
        print(res)
    
    """
    # Load as a gear
    with open('pipeline.py', 'rb') as f:
        gear = f.read()
        res = conn.execute_command('RG.PYEXECUTE', gear, 'REQUIREMENTS', 'nltk')
        print(res)
    """
