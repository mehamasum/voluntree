{% extends "mail_templated/base.tpl" %}

{% block subject %}
OTP for email verification
{% endblock %}

{% block body %}
Your One Time Password (OTP) is: <strong>{{code}}</strong>

<i>Powered by Voluntree</i>
{% endblock %}