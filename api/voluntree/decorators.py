from functools import wraps
from rest_framework import exceptions
from datetime import datetime


def date_range_params_check(f):
    @wraps(f)
    def decorator(self, request, *args, **kwargs):
        errors = {}
        from_date = self.request.query_params.get('from_date', None)
        to_date = self.request.query_params.get('to_date', None)

        if not from_date and to_date:
            errors['from_date'] = 'from_date is mendatory in query params'
        if not to_date and from_date:
            errors['to_date'] = 'to_date is mendatory in query params'

        if from_date:
            try:
                datetime.strptime(from_date, '%Y-%m-%d')
            except ValueError:
                errors[
                    'from_date'] = 'from_date is in incorrect format, should be YYYY-MM-DD'  # noqa
      
        if to_date:
            try:
                datetime.strptime(to_date, '%Y-%m-%d')
            except ValueError:
                errors[
                    'to_date'] = 'to_date is in incorrect format, should be YYYY-MM-DD'  # noqa
       

        if not errors and from_date and to_date:
            start_date = datetime.strptime(from_date, '%Y-%m-%d')
            end_date = datetime.strptime(to_date, '%Y-%m-%d')
            diff = end_date - start_date
            total_days = diff.days + 1
            if total_days <= 0:
                errors['from_date'] = 'from_date cannot be less than to_date'

        if errors:
            raise exceptions.ValidationError(errors)

        return f(self, request, *args, **kwargs)

    return decorator
