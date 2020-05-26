```bash
cd PROJECT_ROOT
source .venv/bin/activate

# run redis
docker pull redislabs/redismod:latest
docker run -d -p 6379:6379 redislabs/redismod:latest
docker exec -it <CONTAINER ID> bash
apt-get install -y sqlite3  
apt-get install -y python-pysqlite2  
apt-get install -y python-pysqlite2-dbg  
apt-get install -y libsqlite3-dev   
apt-get install -y sqlite 

# install requirments
pip install -r api/requirments.ml.txt

cd api/voluntree/ml

python init.py

python test.py
```