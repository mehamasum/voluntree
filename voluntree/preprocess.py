import json
import numpy as np
import nltk
from nltk.stem.lancaster import LancasterStemmer

data = json.loads("""
{"words": ["'m", "'s", "am", "anyon", "ar", "bye", "can", "card", "cash", "count", "credit", "day", "defin", "do", "good", "goodby", "hello", "help", "hi", "hour", "how", "i", "in", "interest", "is", "join", "lat", "mastercard", "me", "on", "op", "see", "thank", "that", "ther", "to", "today", "us", "want", "what", "when", "ye", "yo", "you"], "classes": ["goodbye", "greeting", "hours", "interested", "opentoday", "payments", "thanks"]}
""")
dictionary = data['words']


# nltk.download('punkt')


def sentence_to_embeding(sentence):
    # tokenize the pattern
    sentence_words = nltk.word_tokenize(sentence)
    # stem each word
    stemmer = LancasterStemmer()
    sentence_words = [stemmer.stem(word.lower()) for word in sentence_words]
    
    # embeding of words
    embeding = [0.0]*len(dictionary)
    for s in sentence_words:
        for i,w in enumerate(dictionary):
            if w == s: 
                embeding[i] = 1.0
    return embeding
