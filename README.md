# Voluntree

## Local development
```
# goto project root
cd YOUR_PROJECT_ROOT_DIRECTORY

# setup python virtual environment for project 
virtualenv -p python3.6 .venv

# activate virtual environment
source .venv/bin/activate # for linux
.venv/Scripts/activate  # for windowns

# set environment variables
cp env.example .env

# install backend (api) dependencies
pip install -r requirements.txt

# Run redis
docker run -p 6379:6379 redis

# Install ML dependencies
while read line; do python -m nltk.downloader $line; done < nltk.txt

# migrate database with the application models
python manage.py migrate

# open up server
ngrok -p 8000

# add the ngrok https url to .env
APP_URL='https://foo.ngrok.io'

# run backend server
python manage.py runserver 0.0.0.0:8000

# create an admin account
python manage.py createsuperuser

# create an org and associate admin with the org
# login to http://localhost:8000/api/admin/

# setup webhook callbacks for our fb app (admin login required)
http://localhost:8000/facebook/setup/

# run celery
celery -A config worker -B -l debug

# install frontend dependencies
npm i

# run cra dev server
npm start

```

## Deploy to Heroku

#### Live demo: https://voluntree.herokuapp.com

```
admin
admin@voluntree.com
I5ZJW42Kjy0&
```

```
# create a new heroku app
heroku create app-name

heroku buildpacks:add heroku/nodejs
heroku buildpacks:add heroku/python --index 2


heroku addons:create heroku-postgresql
heroku addons:create heroku-redis

# set env using cli or heroku app settings on their dashboard
heroku config:set DJANGO_DEBUG=False
... 
# and otheres


git push heroku master
heroku run python manage.py createsuperuser


# other useful commands
heroku logs --tail
heroku pg:info
heroku pg:killall
```

### Deploy to AWS

#### Live demo: https://voluntree.ml

```
admin
admin@voluntree.ml
I5ZJW42Kjy0&
```

Launch EC2 Ubuntu 16 instance 
1. with a new Key Pair, 
2. allow inbound traffic on SSH, HTTP, HTTPS
3. Assign an elastic IP
4. Set the IP as CNAME record in your domains DNS record
5. Create a RDS Instance


Setup:
```bash
chmod 400 key.pem
ssh ubuntu@IP -i key.pem

sudo apt-get update
sudo apt-get upgrade

sudo ufw app list
sudo ufw allow 'OpenSSH'
sudo ufw enable
sudo ufw status

# postgres (skipped, used AWS RDS)
sudo apt-get install python3-pip python3-dev libpq-dev postgresql postgresql-contrib

# node
sudo apt install build-essential apt-transport-https lsb-release ca-certificates curl
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get install -y nodejs

# python 3.6
sudo apt-get install python3.6
python3.6 --version

# nginx and https
sudo apt-get install nginx
sudo service nginx start
systemctl status nginx
sudo ufw allow 'Nginx HTTP'

sudo vim /etc/nginx/sites-available/default
>> server_name example.com www.example.com;
sudo nginx -t
sudo systemctl reload nginx
sudo ufw allow 'Nginx Full'
sudo ufw delete allow 'Nginx HTTP'
sudo ufw status

sudo apt-get update
sudo apt-get install software-properties-common
sudo add-apt-repository universe
sudo add-apt-repository ppa:certbot/certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

sudo certbot --nginx -d voluntree.ml -d www.voluntree.ml
sudo certbot renew --dry-run

# redis - (skipped, used redislab)
sudo apt-get install redis-server
sudo systemctl enable redis-server.service
redis-cli info server

# virtualenv
export LC_ALL="en_US.UTF-8"
export LC_CTYPE="en_US.UTF-8"
sudo dpkg-reconfigure locales
sudo pip3 install virtualenv
virtualenv -p python3.8 .venv

# git
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
cat ~/.ssh/id_rsa.pub
git clone git@github.com:mehamasum/voluntree.git

# env
sudo vim .env
REDIS_URL=redis://redis:S2i6BFmKQcDGHN4dgyfhCNs21bdpUWuf@redis-17920.c56.east-us.azure.cloud.redislabs.com:17920

# supervisor
sudo apt-get install supervisor
sudo vim /etc/supervisor/conf.d/asgi.conf
sudo mkdir /run/daphne/
sudo touch /var/log/asgi-out.log
sudo touch /var/log/asgi-out.log

sudo vim /etc/supervisor/conf.d/celeryworker.conf
sudo touch /var/log/celeryworker-out.log
sudo touch /var/log/celeryworker-out.log

sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl tail -f asgi:asgi0
sudo supervisorctl tail -f celeryworker

# create an admin account
python manage.py createsuperuser

# create an org and associate admin with the org
# login to /api/admin/

# setup webhook callbacks for our fb app (admin login required)
# /facebook/setup/
```

CD:
```bash
cd code/voluntree

git pull origin master
source .venv/bin/activate

sudo supervisorctl stop all

npm i
npm run build

pip install -r requirements.txt
while read line; do python -m nltk.downloader $line; done < nltk.txt
python manage.py collectstatic --noinput

sudo supervisorctl start all

python manage.py migrate
```

Commonly used commands:
```bash
htop
systemctl list-unit-files | grep enabled
sudo systemctl | grep running
```
