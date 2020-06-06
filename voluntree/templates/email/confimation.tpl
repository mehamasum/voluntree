{% extends "mail_templated/base.tpl" %}

{% block subject %}
Hello Dear,
{% endblock %}

{% block body %}
Your confirmation code is {{code}} for Voluntree. 
{% endblock %}