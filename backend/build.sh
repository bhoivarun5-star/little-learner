#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate
PYTHONIOENCODING=utf-8 python manage.py seed_data
