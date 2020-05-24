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

If you see:

```bash
[nltk_data] Downloading package punkt to /Users/newscred/nltk_data...
[nltk_data]   Package punkt is already up-to-date!
Processed [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]
{'sentence': "Nice! I'm interested. See you then!", 'embeding': [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]}
OK
OK
[[6.7968928e-04 2.3655132e-06 5.9218252e-07 9.9931157e-01 2.4811370e-06
  1.7273668e-06 1.5625546e-06]]
OUTPUT: 3 interested
Processed [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1]
{'sentence': "I can't come but still want to help. Do you accept donations on credit card?", 'embeding': [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1]}
OK
OK
[[1.0150851e-05 1.2889407e-06 2.7037203e-07 5.2372821e-02 1.0688313e-04
  9.4654036e-01 9.6822891e-04]]
OUTPUT: 5 payments
```