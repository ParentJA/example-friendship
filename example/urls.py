# Django imports...
from django.conf.urls import include, url
from django.contrib import admin
from django.views.generic import TemplateView

urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'^api/v1/accounts/', include('accounts.urls')),
    url(r'^api/v1/friendships/', include('friendships.urls')),
    url(r'^$', TemplateView.as_view(template_name='index.html')),
]
