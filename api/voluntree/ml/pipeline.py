import json
from urllib.parse import urlparse

import redisai
import numpy as np
import nltk
from nltk.stem.lancaster import LancasterStemmer



nltk.download('punkt')
stemmer = LancasterStemmer()

# Set up Redis connection
url = urlparse('redis://127.0.0.1:6379')
conn = redisai.Client(host=url.hostname, port=url.port)
if not conn.ping():
    raise Exception('Redis unavailable')


data = json.loads("""
{"words": ["'m", "'s", "am", "anyon", "ar", "bye", "can", "card", "cash", "count", "credit", "day", "defin", "do", "good", "goodby", "hello", "help", "hi", "hour", "how", "i", "in", "interest", "is", "join", "lat", "mastercard", "me", "on", "op", "see", "thank", "that", "ther", "to", "today", "us", "want", "what", "when", "ye", "yo", "you"], "classes": ["goodbye", "greeting", "hours", "interested", "opentoday", "payments", "thanks"]}
""")
dictionary = data['words']
output_classes = data['classes']


def xlog(*args):
    """
    redisgears.executeCommand('xadd', 'log', '*', 'text', ' '.join(map(str, args)))
    """
    print(' '.join(map(str, args)))

def preprocess(sentence):
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
    
    xlog('Processed', embeding)
    return {
        'sentence': sentence,
        'embeding': embeding
    }

def model_run(embedding):
    print(embedding)
    
    res = conn.tensorset('tensor:input-interestnet', embedding['embeding'], shape=(1, 44), dtype='float')
    print(res)

    res = conn.modelrun('model:interestnet', inputs=['tensor:input-interestnet'], outputs=['tensor:output-interestnet'])
    print(res)

    res = conn.tensorget('tensor:output-interestnet', as_numpy=True)
    print(res)

    index = np.argmax(res)

    print("OUTPUT:", index, output_classes[index])

def envoke_task():
    pass


"""
# Gear builder
GB('KeysReader').\
    foreach(preprocess).\
    register(mode='sync', prefix='test:*')
"""