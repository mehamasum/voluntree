{% extends "mail_templated/base.tpl" %}

{% block subject %}
OTP for email verification
{% endblock %}

{% block body %}
Your One Time Password (OTP) is: {{code}}

Powered by Voluntree
{% endblock %}