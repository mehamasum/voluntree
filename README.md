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

# run backend server
python manage.py runserver 0.0.0.0:8000

# run celery
celery -A config worker -B -l info


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


# set env using cli or heroku app settings on their dashboard
heroku config:set DJANGO_DEBUG=False
... 
# and otheres


git push heroku master
heroku run python manage.py createsuperuser
```