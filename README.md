# Voluntree

```
# goto project root
cd YOUR_PROJECT_ROOT_DIRECTORY

# setup python virtual environment for project 
virtualenv -p python3.6 .venv

# activate virtual environment
source .venv/bin/activate # for linux
.venv/Scripts/activate  # for windowns

# install backend (api) dependencies
pip install -r api/requirements.txt

# Run redis
docker-compose build
docker-compose up

# Install ML dependencies
python 
>>> import nltk
>>> nltk.download('punkt')
>>> exit()

# upload model and gears to redis
cd api/ml
python init-model.py
python init-gear.py

# migrate database with the application models
python api/manage.py migrate

# run backend server
python api/manage.py runserver

# run celery
cd api
celery -A config worker -B -l info

# run react dev server
npm run start:app
