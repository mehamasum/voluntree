import json
import numpy as np
from redisgears import executeCommand as execute
import redisAI

def xlog(*args):
    execute('XADD', 'logs', '*', 'msg', ' '.join(map(str, args)))

def model_run(message):
    key = message['key']
    id = message['id']
    value = message['value']

    xlog("model_run input", id, value)

    value = json.loads(value['comment'])

    embedding = value['embeding']
    payload = value['payload']

    xlog("model_run embedding", embedding, type(embedding))

    data = json.loads("""
    {"words": ["'m", "'s", "am", "anyon", "ar", "bye", "can", "card", "cash", "count", "credit", "day", "defin", "do", "good", "goodby", "hello", "help", "hi", "hour", "how", "i", "in", "interest", "is", "join", "lat", "mastercard", "me", "on", "op", "see", "thank", "that", "ther", "to", "today", "us", "want", "what", "when", "ye", "yo", "you"], "classes": ["goodbye", "greeting", "hours", "interested", "opentoday", "payments", "thanks"]}
    """)
    dictionary = data['words']
    output_classes = data['classes']
    target_class = output_classes.index("interested")

    MODEL = 'model:interestnet'

    # Create the RedisAI model runner and run it
    input_tensor = redisAI.createTensorFromValues('FLOAT', [1, 44], iter(embedding))

    runner = redisAI.createModelRunner(MODEL)
    redisAI.modelRunnerAddInput(runner, 'x', input_tensor)
    redisAI.modelRunnerAddOutput(runner, 'Identity')

    model_replies = redisAI.modelRunnerRun(runner)
    model_output = redisAI.tensorToFlatList(model_replies[0])
    xlog("model_run model_replies", model_replies, len(model_replies), model_output)


    index = np.argmax(np.array(model_output))

    is_interested = True if index == target_class else False

    xlog("model_run output", is_interested)

    if is_interested:
        execute('XADD', 'interests:fb', '*', 'comment', json.dumps(payload))


GearsBuilder('StreamReader').\
    foreach(model_run).\
    register(mode='sync', prefix='comments:*', batch=1, trimStream=True)

