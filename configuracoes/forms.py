
from django import forms
from .models import PreferenciasUsuario, ConfiguracoesSistema


class PreferenciasUsuarioForm(forms.ModelForm):

    class Meta:
        model = PreferenciasUsuario

        fields = [
            'tema',
            'cor_destaque',
            'registros_por_pagina',
            'pagina_inicial',
            'formato_data',
            'confirmar_exclusao',
            'confirmar_saida_produto',
            'notificar_novos_cadastros',
            'notificar_saidas',
            'notificar_estoque_baixo',
            'notificar_alteracoes',
            'notificacoes_sonoras',
        ]

        widgets = {

            # APARÊNCIA
            'tema': forms.Select(attrs={
                'id': 'selectTema',
                'class': 'select-configuracao',
            }),

            'cor_destaque': forms.Select(attrs={
                'id': 'selectCorDestaque',
                'class': 'select-configuracao',
            }),

            # NAVEGAÇÃO
            'registros_por_pagina': forms.Select(attrs={
                'id': 'selectRegistrosPagina',
                'class': 'select-configuracao',
            }),

            'pagina_inicial': forms.Select(attrs={
                'id': 'selectPaginaInicial',
                'class': 'select-configuracao',
            }),

            'formato_data': forms.Select(attrs={
                'id': 'selectFormatoData',
                'class': 'select-configuracao',
            }),

            # CONFIRMAÇÕES
            'confirmar_exclusao': forms.CheckboxInput(attrs={
                'id': 'id_confirmar_exclusao',
            }),

            'confirmar_saida_produto': forms.CheckboxInput(attrs={
                'id': 'id_confirmar_saida_produto',
            }),

            # NOTIFICAÇÕES
            'notificar_novos_cadastros': forms.CheckboxInput(attrs={
                'id': 'id_notificar_novos_cadastros',
            }),

            'notificar_saidas': forms.CheckboxInput(attrs={
                'id': 'id_notificar_saidas',
            }),

            'notificar_estoque_baixo': forms.CheckboxInput(attrs={
                'id': 'id_notificar_estoque_baixo',
            }),

            'notificar_alteracoes': forms.CheckboxInput(attrs={
                'id': 'id_notificar_alteracoes',
            }),

            'notificacoes_sonoras': forms.CheckboxInput(attrs={
                'id': 'id_notificacoes_sonoras',
            }),
        }


class ConfiguracoesSistemaForm(forms.ModelForm):

    class Meta:
        model = ConfiguracoesSistema

        fields = [
            'quantidade_minima_estoque',
            'alertar_estoque_baixo',
            'exigir_cliente_saida',
            'confirmar_saida_produto',
            'tempo_inatividade_sessao',
            'registrar_historico_alteracoes',
        ]

        widgets = {

            # ESTOQUE
            'quantidade_minima_estoque': forms.NumberInput(attrs={
                'id': 'inputQuantidadeMinimaEstoque',
                'class': 'input-configuracao',
                'min': 0,
                'step': 1,
            }),

            'alertar_estoque_baixo': forms.CheckboxInput(attrs={
                'id': 'id_alertar_estoque_baixo',
            }),

            'exigir_cliente_saida': forms.CheckboxInput(attrs={
                'id': 'id_exigir_cliente_saida',
            }),

            'confirmar_saida_produto': forms.CheckboxInput(attrs={
                'id': 'id_confirmar_saida_produto_sistema',
            }),

            # SEGURANÇA
            'tempo_inatividade_sessao': forms.NumberInput(attrs={
                'id': 'inputTempoInatividade',
                'class': 'input-configuracao',
                'min': 5,
                'max': 1440,
                'step': 1,
            }),

            'registrar_historico_alteracoes': forms.CheckboxInput(attrs={
                'id': 'id_registrar_historico_alteracoes',
            }),
        }

    def clean_tempo_inatividade_sessao(self):
        tempo = self.cleaned_data.get('tempo_inatividade_sessao')

        if tempo is not None and not 5 <= tempo <= 1440:
            raise forms.ValidationError(
                'O tempo de inatividade deve estar entre 5 e 1440 minutos.'
            )

        return tempo
