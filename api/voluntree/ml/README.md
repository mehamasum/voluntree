```bash
cd PROJECT_ROOT
source .venv/bin/activate

# run redis
docker pull redislabs/redismod:edge
docker run -d -p 6379:6379 redislabs/redismod:edge

# install requirments
pip install -r api/requirments.ml.txt

cd api/voluntree/ml

python init.py

python test.py
```