```bash
cd PROJECT_ROOT
source .venv/bin/activate

# run redis
docker pull redislabs/redismod:edge
docker run -d -p 6379:6379 redislabs/redismod:edge

# install requirments
pip install -r api/requirments.ml.txt

Run the Python interpreter and type the commands:
>>> import nltk
>>> nltk.download('punkt')
>>> exit()

cd api/voluntree/ml

python init.py
```
