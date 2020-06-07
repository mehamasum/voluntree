![Imgur](https://i.imgur.com/tquLFsB.png)


## Redis Usage
Along with usage as cache and some other Redis data structures, we used:
1. Lists (for task queue) and Pub/Sub (as backend for distributed realtime communication)
2. Streams
3. RedisGear
4. RedisAI


## Overview
This project demonstrates a possible deployment of the RedisMod stack that provides real-time intent classification for recruting volunteers from social media platforms and keeping a channel of communicate with them.

The following diagram depicts the flows between the system's parts.

![Imgur](https://imgur.com/41DnUBs.jpg)

1. Nonprofit Admin creates a "signup" post (signup and posting are decoupled now _NEW!_)
2. Voluntree enques a task
3. A worker picks up the task
4. Worker publishes the post in Facebook
5. Facebook user cretes a comment (or sends message in messenger _NEW!_)
6. Voluntree receives the comment with a webhook callback
7. The webhook callback enques a preprocessing task
8. A worker picks it up and turns the comment into a embedding (requires Disk IO)
9. Worker puts a messeage (the embedding and the original comment) in a stream
10. A gear reads messages from the stream (in batch)
11. Gear triggers a Model run for the entire batch of messages in Redis AI
12. Redis AI detects whether the commenter is interested in volunteering
13. Gear writes the message (model run output and the original comment) to another stream
14. A worker polls the stream for new comments
15. It writes them down in database (in bulk)
16. It sends appropriate reply (or comment or ask further questions _NEW!_) to the FB user
17. It writes message to the correct channel so that consumers listening to the group gets update in real time
18. Nonprofit admin see signups in realtime via WebSocket updates


## Use Cases

### Lists and Pub/Sub
We use [Celery](https://docs.celeryproject.org/en/latest/index.html) which is a distributed task queue with focus on [real-time processing](https://github.com/mehamasum/voluntree/blob/master/voluntree/tasks.py), while also supporting [task scheduling](https://github.com/mehamasum/voluntree/blob/master/schedule_task/tasks.py). Celery communicates via messages, using a broker to mediate between clients and workers. To initiate a task, a client adds a message to the queue, which the broker then delivers to a worker. We are using Redis for message transport support for Celery. We need several queues for this:

- Publishing Queue (posts a status to Facebook)
- Comment Preprocessing Queue (converts a comment (i.e. text) to a Tensor (i.e. numbers))
- Reply Queue (posts a reply or private message to a Facebook user)
- DB Write Queue (writes new comments from a stream to our Database in bulk)
- Email Queue (sends verification email before creating any 3rd party integration account _NEW!_)



We use [Django Channels](https://channels.readthedocs.io/en/latest/introduction.html) which changes Django to weave asynchronous code underneath and through Django’s synchronous core, allowing Django projects to handle not only HTTP, but protocols that require long-running connections too - [in our case, the WebSockets](https://github.com/mehamasum/voluntree/blob/master/src/services/Posts/InterestedVolunteers/index.js). It bundles an event-driven architecture with _channel layers_, a system that allows us to easily communicate between processes. `channels_redis` is the only official Django-maintained channel layer supported for production use. The layer uses Redis as its backing store and levarages Lists, Pub/Sub etc. Right now we only one group of [consumers](https://github.com/mehamasum/voluntree/blob/master/voluntree/consumers.py) that listen to when a new signup is generated, but the list will grow longer soon.

These usecases are useful parts of making a distributed realtime application.


### RedisAI 

We defined our machine learning model using Tensorflow. Once we were happy with the results we "froze" the model to a `frozen_graph.pb` file using the following piece of code:

```py
from tensorflow.python.framework.convert_to_constants import convert_variables_to_constants_v2

# Save model to SavedModel format
tf.saved_model.save(model, "tmp/models")

# Convert Keras model to ConcreteFunction
full_model = tf.function(lambda x: model(x))
full_model = full_model.get_concrete_function(
    tf.TensorSpec(model.inputs[0].shape, model.inputs[0].dtype))

# Get frozen ConcreteFunction
frozen_func = convert_variables_to_constants_v2(full_model)
frozen_func.graph.as_graph_def()

layers = [op.name for op in frozen_func.graph.get_operations()]

# Save frozen graph from frozen ConcreteFunction to hard drive
tf.io.write_graph(graph_or_graph_def=frozen_func.graph,
                  logdir="tmp/frozen_models",
                  name="frozen_graph.pb",
                  as_text=False)
```
We struggled with this peice particulary because we [couldn't find any documentation](https://github.com/tensorflow/tensorflow/issues/27614) on freezing graph in TensorFlow 2.1x. 

We created a [script](https://github.com/mehamasum/voluntree/blob/master/ml/init-model.py) that would load the model into the memory.  

We created [another script](https://github.com/mehamasum/voluntree/blob/45610b036d76ba8c034ad1d7127b6ad28d7e5dcc/api/voluntree/ml/pipeline.py) to test whether the model was producing correct response since the frozen graph will be executed using the TensorFlow 1.15 backend whereas it was initially developed with TensorFlow 2.1x.
In that script we made use of the [RedisAI commands](https://oss.redislabs.com/redisai/commands):
```py
def model_run(embedding):
    MODEL = 'model:interestnet'
    INPUT = 'tensor:input-interestnet'
    OUTPUT = 'tensor:output-interestnet'

    res = conn.tensorset(INPUT, embedding['embeding'], shape=(1, 44), dtype='float')
    res = conn.modelrun(MODEL, inputs=[INPUT], outputs=[OUTPUT])
    res = conn.tensorget(OUTPUT, as_numpy=True)

    index = np.argmax(res)
    res = True if index == target_class else False

	return res
```

When we were satisfied with results we integrated the Redis Gears to take advantage of the C interface to connect to RedisAI.  


### RedisGears

Our "Comment Preprocessing Queue" acts as producer and adds a preprocessed comments (as a list of numbers) to a Redis Stream. The new comment triggers the execution of a RedisGear. [This gear](https://github.com/mehamasum/voluntree/blob/master/ml/gear.py) prepares the input to the model's requirements (i.e. creates a Tensor from the lists of numbers it consumed from the stream) and calls Redis AI to execute an intent classification model on the comment. Then it stores the model's outputs (i.e. whether intent of the comment is to signup as volunteer) in another Redis Stream.

Interfacing Redis Gears with Redis AI was the most channeling integration. There were very little documentation and only a few examples on how to do this integration. The examples all used a library named `redisAI` and we couldn’t find it anywhere on the internet. After much struggle we learned that this library is automatically made available in the Redis Gear runtime python environment and that is a C language interface to the RedisAI. Also the module itself doesn’t have any public documentation. So we had to read through the open source code of RedisGear line by line to find how to achieve something that we want to achieve.

All the examples on the internet worked with Blobs (`createTensorFromBlob`) as model input, but in out case it was a list of floating numbers. We tried to follow the Blob examples but found out that executing a Tensorflow model on Redis Gear seem to be yielding wrong and different outputs than those of Redis CLI. Whereas the CLI matches the output running on native Tensorflow. This resulted in a discussion on [Redis Community](https://forum.redislabs.com/t/tensorflow-model-yields-different-outputs-on-redis-gear-correct-redisai-implementation/479). Meanwhile we looked through the source code and found out there was another API named `createTensorFromValues` which would suite our usecase better but it had a bug in it. We found some issues on that particular function and immediately issued a PR to solve it. @meirsh from Redis team was kind enough to review and merge the PR at very late hours of night. After all this hassel we finally was able to get a gear up and running that would listen to a stream for input and run it through the model to decide on a outcome. This is a sample working version of code that we [ended up with](https://github.com/mehamasum/voluntree/blob/master/ml/gear.py):

```py
from redisgears import executeCommand as execute
import redisAI


def xlog(*args):
    execute('XADD', 'logs', '*', 'msg', ' '.join(map(str, args)))

def model_run():
    input = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]
    input_tensor = redisAI.createTensorFromValues('FLOAT', [1, 44], iter(input))

    runner = redisAI.createModelRunner('mymodel')
    redisAI.modelRunnerAddInput(runner, 'x', input_tensor)
    redisAI.modelRunnerAddOutput(runner, 'Identity')

    model_replies = redisAI.modelRunnerRun(runner)
    model_output = redisAI.tensorToFlatList(model_replies[0])
    xlog("model_run model_output", model_output)

model_run()
GearsBuilder().run()
```


### Streams
We use two main streams (other than some log and minor usecases).

1. Comment Stream  
Preprocessed comments are [put into this stream by a worker](https://github.com/mehamasum/voluntree/blob/master/voluntree/tasks.py#L33) and Redis Gears reads messages from this one in batch. Then it feeds the entire batch into a machine learning model which generates outputs in batch. The output is written to a second stream

2. Interest Stream
Redis Gears write out the positive outcomes (i.e. the comments where people expressed interests to signup as volunteer). [Another worker](https://github.com/mehamasum/voluntree/blob/master/schedule_task/tasks.py#L46) reads from this stream and writes the comments in the database in a bulk. It also initiate relevant tasks like sending update to channel layer, sending reply/message to Facebook commenter etc.
