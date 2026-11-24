from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import views as auth_views
from django.conf import settings
from django.conf.urls.static import static


class DebugPasswordResetView(auth_views.PasswordResetView):

    def form_valid(self, form):
        print("\n========== PASSWORD RESET ==========")
        print("Solicitação de redefinição recebida!")
        print("E-mail:", form.cleaned_data.get("email"))
        print("====================================\n")

        return super().form_valid(form)


urlpatterns = [
    path('admin/', admin.site.urls),

    # 🔐 LOGIN CUSTOM
    path('accounts/login/', auth_views.LoginView.as_view(template_name='accounts/login.html'), name='login'),

    # 🔐 PASSWORD RESET
    
    path(
        'accounts/password_reset/',
        DebugPasswordResetView.as_view(
            template_name='registration/password_reset_form.html',
            html_email_template_name='registration/password_reset_email.html',
            subject_template_name='registration/password_reset_subject.txt',
            success_url='/accounts/password_reset/done/',
        ),
        name='password_reset'
    ),


    path(
        'accounts/password_reset/done/',
        auth_views.PasswordResetDoneView.as_view(
            template_name='registration/password_reset_done.html'
        ),
        name='password_reset_done'
    ),

    path(
        'accounts/reset/<uidb64>/<token>/',
        auth_views.PasswordResetConfirmView.as_view(
            template_name='registration/password_reset_confirm.html'
        ),
        name='password_reset_confirm'
    ),

    path(
        'accounts/reset/done/',
        auth_views.PasswordResetCompleteView.as_view(
            template_name='registration/password_reset_complete.html'
        ),
        name='password_reset_complete'
    ),

    # 📦 APPS
    path('', include('accounts.urls')),
    path('', include('core.urls')),
    path('accounts/logout/', auth_views.LogoutView.as_view(), name='logout'),
    
    path("notificacoes/",include("notificacoes.urls")),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)