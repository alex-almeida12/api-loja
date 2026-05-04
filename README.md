# 🛒 API Loja Virtual — Prática Integradora UC31

Projeto completo da **Prática Integradora (Aula 15)** da UC31, integrando todo o conteúdo das **Aulas 01 a 14**.

> **Curso:** Técnico em Informática para Internet Integrado ao Ensino Médio  
> **Instituição:** SENAC/RN — MedioTec Mossoró  
> **Professor:** Alex Almeida

---

## 🚀 Como executar

```bash
cd api-loja
npm install
npm run dev
```

Acesse: http://localhost:3000

---

## 📁 Estrutura do projeto

```
api-loja/
├── src/
│   ├── app.ts              ← Servidor completo
│   └── views/
│       ├── produtos.ejs    ← Lista com tabela + estatísticas
│       ├── detalhe.ejs     ← Detalhe de 1 produto
│       ├── cadastrar.ejs   ← Formulário de cadastro
│       └── erro.ejs        ← Página 404
├── public/
│   ├── index.html          ← Landing page
│   └── styles.css          ← Tema SENAC
├── dados/
│   └── produtos.json       ← Persistência (criado automaticamente!)
├── package.json
├── tsconfig.json
└── .gitignore
```

---

## 🔌 Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | /produtos | Listar todos |
| GET | /produtos?categoria=Roupa | Filtrar por categoria |
| GET | /produtos?disponivel=true | Filtrar disponíveis |
| GET | /produtos/:id | Buscar por ID |
| POST | /produtos | Criar (JSON) |
| PUT | /produtos/:id | Atualizar |
| DELETE | /produtos/:id | Remover |

## 🌐 Páginas

| Rota | Descrição |
|---|---|
| / | Página inicial |
| /pagina/produtos | Catálogo visual |
| /pagina/produtos/:id | Detalhe do produto |
| /pagina/cadastrar | Formulário de cadastro |

---

## 📚 Conteúdo aplicado por aula

| Aula | Conteúdo | Onde aparece |
|---|---|---|
| 02-06 | TypeScript | Interfaces, tipos, export/import |
| 07 | Express | Servidor, app.listen |
| 08-09 | CRUD | GET, POST, PUT, DELETE |
| 09 | Middleware | Logger, validarCampos |
| 10 | Validação | ApiResponse, status codes, typeof |
| 11 | EJS | Views, forEach, if/else |
| 12 | Formulários | form, urlencoded, redirect PRG |
| 13 | Async/await | Promises, try/catch |
| 14 | Persistência | fs.promises, readFile, writeFile |
