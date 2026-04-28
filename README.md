#  Core Access Manager

Sistema fullstack de gerenciamento de usuários com autenticação e controle de permissões, desenvolvido com foco em arquitetura escalável, boas práticas e simulação de ambiente real de desenvolvimento.

---

## 📌 Sobre o projeto

O **Core Access Manager** é um mini SaaS que simula um sistema interno de empresas para gestão de usuários.

O projeto foi desenvolvido com o objetivo de aplicar conceitos de:

* Arquitetura em camadas
* Organização por módulos (feature-based)
* Autenticação com JWT
* Testes automatizados
* Boas práticas de Git (branches, commits, fluxo de trabalho)
* Separação de responsabilidades

---

## 🧠 Arquitetura

O backend segue uma arquitetura **modular com separação em camadas**, onde cada domínio concentra suas responsabilidades:

```bash
src/
  modules/
    users/
      users.controller.ts
      users.service.ts
      users.repository.ts

    auth/
      auth.controller.ts
      auth.service.ts

  middlewares/
  utils/
  config/
```

### 🔄 Fluxo da aplicação

Request → Route → Controller → Service → Repository → Database

---

## 🛠️ Tecnologias

### Backend

* Node.js
* TypeScript
* Express
* Sequelize
* PostgreSQL

### Frontend

* React

### Ferramentas

* tsx (execução TypeScript)
* Git & GitHub
* Jest (testes)

---

## 🔐 Funcionalidades

* ✅ Autenticação com JWT
* ✅ CRUD de usuários
* ✅ Controle de permissões (admin/user)
* ✅ Proteção de rotas
* ⏳ Testes unitários e de integração
* ⏳ Dashboard com métricas

---

## 📦 Instalação

```bash
# clonar o projeto
git clone https://github.com/seu-usuario/core-access-manager.git

# entrar na pasta backend
cd backend

# instalar dependências
npm install
```

---

## ▶️ Rodando o projeto

```bash
npm run dev
```

Servidor rodando em:

```
http://localhost:3000
```

---

## 🔀 Fluxo de Git

O projeto segue um fluxo baseado em:

* main → produção
* develop → integração
* feature/* → novas funcionalidades

Exemplo:

```bash
git checkout -b feature/create-user
```

---

## 🧪 Testes

(Em desenvolvimento)

O projeto incluirá:

* Testes unitários (services)
* Testes de integração (rotas)
* Uso de mocks

---

## 📚 Aprendizados aplicados

* Separação de responsabilidades
* Organização de código escalável
* Estruturação de APIs REST
* Simulação de ambiente de equipe com Git
* Boas práticas de desenvolvimento backend

---

## 🚀 Próximos passos

* [ ] Implementar testes automatizados
* [ ] Adicionar cache com Redis
* [ ] Implementar refresh token
* [ ] Deploy em ambiente cloud (AWS)
* [ ] CI/CD com GitHub Actions

---

## 👨‍💻 Autor

Desenvolvido por Breno

---

## 📄 Licença

Este projeto está sob a licença MIT.
