import json
from urllib.parse import urlparse

import redisai
import numpy as np
import nltk
from nltk.stem.lancaster import LancasterStemmer
from ..tasks import send_message_on_comment


data = json.loads("""
{"words": ["'m", "'s", "am", "anyon", "ar", "bye", "can", "card", "cash", "count", "credit", "day", "defin", "do", "good", "goodby", "hello", "help", "hi", "hour", "how", "i", "in", "interest", "is", "join", "lat", "mastercard", "me", "on", "op", "see", "thank", "that", "ther", "to", "today", "us", "want", "what", "when", "ye", "yo", "you"], "classes": ["goodbye", "greeting", "hours", "interested", "opentoday", "payments", "thanks"]}
""")
dictionary = data['words']
output_classes = data['classes']
target_class = output_classes.index("interested")

def xlog(*args):
    """
    redisgears.executeCommand('xadd', 'log', '*', 'text', ' '.join(map(str, args)))
    """
    print(' '.join(map(str, args)))

def preprocess(hook_payload):
    stemmer = LancasterStemmer()

    # Set up Redis connection
    url = urlparse('redis://127.0.0.1:6379')
    conn = redisai.Client(host=url.hostname, port=url.port)
    if not conn.ping():
        raise Exception('Redis unavailable')

    sentence = hook_payload['value']['message']

    # tokenize the pattern
    sentence_words = nltk.word_tokenize(sentence)
    # stem each word
    sentence_words = [stemmer.stem(word.lower()) for word in sentence_words]
    
    # embeding of words
    embeding = [0]*len(dictionary)  
    for s in sentence_words:
        for i,w in enumerate(dictionary):
            if w == s: 
                embeding[i] = 1
    
    res = {
        'hook_payload': hook_payload,
        'embeding': embeding
    }
    
    xlog("preprocess", res)
    return res

def model_run(embedding):
    MODEL = 'model:interestnet'
    INPUT = 'tensor:input-interestnet'
    OUTPUT = 'tensor:output-interestnet'

    res = conn.tensorset(INPUT, embedding['embeding'], shape=(1, 44), dtype='float')
    xlog("tensorset", INPUT, res)

    res = conn.modelrun(MODEL, inputs=[INPUT], outputs=[OUTPUT])
    xlog("modelrun", MODEL, res)

    res = conn.tensorget(OUTPUT, as_numpy=True)
    xlog("tensorget", OUTPUT, res)

    index = np.argmax(res)

    res = {
        'hook_payload': embedding['hook_payload'],
        'interested': True if index == target_class else False
    }

    xlog("model_run", res)
    return res

def envoke_task(result):
    if not result['interested']:
        return

    # TODO task(result['hook_payload'])
    xlog("envoke_task", result)
    send_message_on_comment.apply_async((result['hook_payload'], ))

def pipleline(hook_payload):
    r = preprocess(hook_payload)
    r = model_run(r)
    r = envoke_task(r)


"""
# Gear builder
GB('KeysReader').\
    foreach(preprocess).\
    register(mode='sync', prefix='test:*')
"""
