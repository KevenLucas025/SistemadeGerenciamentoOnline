# 🧠 Sistema de Gerenciamento Online

👋 Olá! Seja bem-vindo à evolução do meu **Sistema de Gerenciamento Desktop**, agora adaptado para uma versão **Online**, com uma interface mais moderna, dinâmica e acessível.

Este projeto representa a evolução do sistema desenvolvido anteriormente, mantendo diversas funcionalidades já existentes e adicionando novos recursos para o gerenciamento de **produtos, usuários e clientes**.

O objetivo é desenvolver uma aplicação cada vez mais **completa, organizada, prática e escalável**, com foco na organização de dados, facilidade de utilização e evolução contínua do sistema.

---

## 🚧 Status do Projeto

⚠️ **Projeto em desenvolvimento**

O sistema já possui suas principais funcionalidades implementadas e continua recebendo melhorias, correções e novos recursos.

> 🛠️ O projeto pode ser testado durante seu desenvolvimento, conforme novas funcionalidades são disponibilizadas.

---

## ⚙️ Tecnologias Utilizadas

O projeto foi desenvolvido utilizando principalmente:

* 🐍 **Python**
* 🌐 **Django** — Back-end e estrutura da aplicação
* 🧱 **HTML5** — Estrutura das páginas
* 🎨 **CSS3** — Estilização e interface
* ⚡ **JavaScript** — Interações e funcionalidades dinâmicas
* 🗄️ **SQLite3** — Banco de dados para ambiente local
* 🐘 **PostgreSQL** — Banco de dados para ambiente online
* 📄 **ReportLab / FPDF** — Geração de relatórios em PDF
* 📊 **CSV** — Importação e exportação de dados

O sistema também utiliza **APIs externas**, como a consulta automática de CEP para preenchimento de informações de endereço.

---

## 📋 Principais Funcionalidades

O sistema reúne diversas funcionalidades para gerenciamento e organização de dados.

Entre os principais recursos estão:

* 🔎 Pesquisa de produtos
* 🔎 Pesquisa de usuários
* 🧑‍💼 Gerenciamento de clientes
* 📦 Gerenciamento de produtos
* 👥 Gerenciamento de usuários
* 📜 Registro de histórico de ações
* 📄 Geração de relatórios
* 📊 Importação e exportação de dados
* ⚡ Cadastro e gerenciamento de informações

A versão Online mantém diversas funcionalidades presentes no sistema Desktop anterior, além de adicionar novos recursos e melhorias na interface.

---

## 📜 Sistema de Histórico

Uma das funcionalidades centrais do sistema é o **registro automático das ações realizadas pelos usuários**.

Sempre que uma ação importante ocorre dentro do sistema, ela pode ser registrada no histórico.

Cada registro pode conter informações como:

* 📅 Data e hora da ação
* 👤 Usuário responsável
* 📝 Descrição da ação realizada
* 📍 Local ou módulo onde a alteração ocorreu

Esse recurso já estava presente na versão Desktop e foi mantido na evolução do projeto Online.

---

## 📦 Gerenciamento de Produtos

A página **Verificar Estoque** permite visualizar e gerenciar os produtos cadastrados no sistema.

Entre as funcionalidades disponíveis:

* ➕ Adicionar novos produtos
* 🔄 Atualizar estoque
* 📤 Registrar saída de produtos
* ↩️ Realizar estorno de saídas
* 🕓 Visualizar histórico
* 🧹 Limpar informações das tabelas
* 🔍 Pesquisar produtos

### 🗃️ Controle de Saída

Quando um produto é retirado do estoque, ele não é excluído imediatamente do banco de dados.

A movimentação é registrada na tabela de **Saída**, permitindo manter o histórico da operação.

Os registros permanecem armazenados por um período mínimo de **12 meses** antes de uma possível remoção definitiva.

Essa funcionalidade já fazia parte do projeto Desktop anterior, porém a versão Online adicionou recursos como a **pesquisa de produtos e melhorias na visualização das informações**.

---

## 👥 Gerenciamento de Usuários

A página **Verificar Usuários** permite visualizar e gerenciar os usuários cadastrados no sistema.

Funcionalidades disponíveis:

* ➕ Cadastro de novos usuários
* ✏️ Edição de informações
* ❌ Exclusão de usuários
* 🔎 Pesquisa rápida por dados

Diferentemente do gerenciamento de produtos, os usuários excluídos **não podem ser restaurados**.

Essa funcionalidade já estava presente na versão Desktop e recebeu melhorias na versão Online, incluindo a possibilidade de **pesquisar usuários diretamente na tabela**.

---

## 🧑‍💼 Gerenciamento de Clientes

A página **Clientes** permite cadastrar e gerenciar clientes dos tipos **Pessoa Física (PF)** e **Pessoa Jurídica (PJ)**.

Principais funcionalidades:

* 📝 Cadastro de clientes
* ✏️ Atualização de informações
* 📄 Geração de relatórios
* 🔎 Pesquisa por nome, CPF ou CNPJ
* 🕓 Histórico de alterações
* 📊 Visualização organizada dos dados

A funcionalidade foi mantida em relação ao projeto anterior, porém recebeu uma **nova interface, melhorias visuais e uma experiência mais dinâmica**.

---

## ⚡ Cadastro em Massa

O sistema também possui recursos para **importação de dados em massa**, facilitando o cadastro de grandes quantidades de informações.

Atualmente, é possível trabalhar com:

* 👥 Clientes
* 📦 Produtos
* 👤 Usuários

Os dados podem ser importados utilizando **arquivos CSV previamente formatados**.

📄 O sistema também disponibiliza **planilhas modelo**, facilitando o preenchimento correto das informações antes da importação.

> 🚧 Esta funcionalidade continua em desenvolvimento e poderá receber novos recursos futuramente.

---

## 🔄 Evolução do Projeto

Este sistema foi desenvolvido como uma evolução direta do meu projeto de gerenciamento Desktop.

A nova versão mantém diversas funcionalidades já desenvolvidas anteriormente, mas passa a utilizar uma arquitetura baseada em **Django**, permitindo que o sistema seja acessado através de um navegador.

### 🖥️ Versão Desktop

A primeira versão foi desenvolvida com foco em aplicações locais utilizando:

* Python
* PySide6
* SQLite3
* Pandas
* ReportLab / FPDF
* CSV

### 🌐 Versão Online

A nova versão utiliza:

* Python
* Django
* HTML5
* CSS3
* JavaScript
* PostgreSQL
* APIs externas

Essa evolução permitiu transformar o projeto em uma aplicação mais acessível e preparada para futuras expansões.

---

## 📌 Objetivos do Projeto

Este projeto foi desenvolvido de forma independente com o objetivo de aprimorar conhecimentos em:

* 🐍 Desenvolvimento com Python
* 🌐 Desenvolvimento Web com Django
* 🗄️ Gerenciamento de bancos de dados
* 🎨 Desenvolvimento de interfaces utilizando HTML e CSS
* ⚡ JavaScript e funcionalidades dinâmicas
* 🔌 Integração com APIs
* 📊 Manipulação e organização de dados
* 📄 Geração de relatórios
* 🏗️ Organização e estruturação de projetos

---

## ⭐ Conclusão

O **Sistema de Gerenciamento Online** representa uma evolução significativa em relação aos meus projetos anteriores.

O projeto foi desenvolvido com foco em:

* 📋 **Organização**
* ⚡ **Praticidade**
* 🚀 **Eficiência**
* 📈 **Escalabilidade**
* 🎨 **Experiência de utilização**
* 🔄 **Evolução contínua**

O sistema continuará recebendo novas melhorias, correções e funcionalidades conforme o projeto evolui.

---

<div align="center">

### 🧠 Sistema de Gerenciamento Online

**Desenvolvido por Keven Lucas**

🐍 Python • 🌐 Django • 🗄️ PostgreSQL • 🎨 HTML/CSS • ⚡ JavaScript

</div>
