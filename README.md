# Voluntree

## Live demo

https://voluntree.herokuapp.com

Credentials
```
admin
admin@voluntree.com
I5ZJW42Kjy0&
```


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
docker-compose build
docker-compose up

# Install ML dependencies
python 
>>> import nltk
>>> nltk.download('punkt')
>>> exit()

# upload model and gears to redis
cd ml
python init-model.py
python init-gear.py

# migrate database with the application models
python manage.py migrate

# open up server
ngrok -p 8000

# add the ngrok https url to .env
APP_URL='https://foo.ngrok.io'
DJANGO_ALLOWED_HOSTS=foo.ngrok.io

# run backend server
python manage.py runserver 0.0.0.0:8000

# create an admin account
python manage.py createsuperuser

# create an org and associate admin with the org
# login to http://localhost:8000/api/admin/

# setup webhook callbacks for our fb app (admin login required)
http://localhost:8000/facebook/setup/

# run celery
celery -A config worker -B -l debug -Q celery,preprocess,conversation,notification,email 


# install frontend dependencies
npm i

# run cra dev server
npm start

```

## Deploy to Heroku

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
