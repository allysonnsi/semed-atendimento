# SEMED Atendimento

Sistema web para gerenciamento de atendimentos presenciais da Secretaria Municipal de Educação de São José de Ribamar (SEMED).

O projeto foi desenvolvido com foco em organização do fluxo de atendimento, gerenciamento de filas, controle de usuários por função, acompanhamento dos atendimentos e disponibilização de um painel público de chamadas.

> 🚧 Projeto em desenvolvimento — atualmente em processo de evolução da camada de dados MOCK para uma arquitetura totalmente integrada ao Supabase.

---

## 📌 Sobre o projeto

O SEMED Atendimento foi criado para digitalizar e organizar o atendimento presencial realizado por diferentes setores da Secretaria de Educação.

A aplicação permite registrar visitantes, gerar senhas, organizar filas por setor e permitir que atendentes controlem o fluxo de chamadas e atendimentos.

O sistema possui diferentes níveis de acesso, garantindo que cada usuário tenha acesso somente às funcionalidades relacionadas à sua função.

### Principais objetivos

- Organizar o fluxo de atendimento presencial;
- Reduzir processos manuais de controle de filas;
- Centralizar informações dos atendimentos;
- Controlar permissões por função;
- Permitir acompanhamento do atendimento em tempo real;
- Registrar informações para consultas posteriores;
- Disponibilizar um painel público para chamadas.

---

## 🚀 Funcionalidades

### 🔐 Autenticação e autorização

- Login utilizando Supabase Auth;
- Controle de acesso baseado em funções;
- Sessões protegidas por middleware;
- Validação de permissões no servidor;
- Usuários ativos/inativos;
- Associação de atendentes a setores.

### 👤 Funções do sistema

O sistema atualmente trabalha com três funções:

| Função | Acesso |
|---|---|
| Administrador | Gerenciamento completo do sistema |
| Recepcionista | Registro de visitantes e gerenciamento das filas |
| Atendente | Atendimento das senhas do seu setor |

### 🏢 Gerenciamento de setores

Administradores podem:

- Criar setores;
- Ativar e desativar setores;
- Definir código do setor;
- Visualizar setores disponíveis;
- Associar atendentes aos respectivos setores.

### 🎫 Atendimento

Fluxo principal:

```text
Recepção
   ↓
Cadastro do visitante
   ↓
Seleção do setor
   ↓
Geração da senha
   ↓
Fila de atendimento
   ↓
Atendente chama a senha
   ↓
Início do atendimento
   ↓
Finalização
