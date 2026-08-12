# 🔗 DevLinks & Bookmark API

Uma API RESTful para gerenciamento de links e _bookmarks_ técnicos desenvolvida com **Node.js**, **Express 5** e **TypeScript**.

O projeto faz parte do repositório [`node-express`](https://github.com/joao-gustavo-silva-lima/node-express) e foi construído aplicando arquitetura em camadas, validação rigorosa de esquemas com **Zod**, gerenciamento de dados em memória via `Map` e um pipeline centralizado de tratamento de exceções HTTP.

---

## 🚀 Tecnologias e Dependências

- **Runtime:** Node.js (`v20+`)
- **Framework Web:** Express.js (`v5.2.1`)
- **Linguagem:** TypeScript (`ESNext` / `NodeNext`)
- **Validação e Schemas:** Zod (`v4.4.3`)
- **Executor Dev:** `tsx` (`v4.23.12`)
- **Persistência:** Repositório em memória (`Map<LinkID, Link>`)

---

## 🏛️ Arquitetura e Estrutura do Código

A aplicação utiliza uma **arquitetura em camadas** bem definida para garantir desacoplamento e testabilidade:

```text
devlinks-express-api/
├── src/
│   ├── controllers/            # Adaptação HTTP (extrai inputs, invoca Service e envia Resposta)
│   ├── services/               # Regras de negócio puras e manipulação da memória (Map)
│   ├── middlewares/            # Interceptadores (Logger, Validador de Body e de Query)
│   ├── routes/                 # Definição de endpoints e encadeamento de middlewares
│   ├── types/                  # Contratos de dados, Schemas Zod e tipos estáticos do TS
│   ├── utils/                  # Classes utilitárias (Exceção customizada StatefulError)
│   ├── app.ts                  # Configuração da aplicação Express e middlewares globais
│   └── server.ts               # Ponto de entrada e inicialização do servidor HTTP
├── package.json
└── tsconfig.json

```

### Destaques de Design e Decisões Técnicas

1. **Express 5 Native Async Handling:** Aproveita o suporte nativo do Express 5 ao tratamento de exceções em rotas assíncronas, dispensando o uso de blocos `try/catch` redundantes nos _controllers_.
2. **Exceções Orientadas a Estado (`StatefulError`):** A classe de erro customizada estende `Error` carregando o código HTTP (`status`). Erros são lançados no `LinkService` e formatados centralizadamente no `errorMiddleware`.
3. **Mecanismo Fail-Fast via Middlewares:** Requisições com payloads ou queries que violam o contrato das entidades são barradas na borda pelo Zod (`validateLinkMiddleware` / `validateQueryMiddleware`) com resposta `400 Bad Request`.
4. **Proteção contra Conflitos de URL:** O `LinkService` garante que URLs duplicadas sejam bloqueadas em rotas de criação e atualização, retornando status `409 Conflict`.
5. **Garantia de Imutabilidade Externa:** O repositório expõe apenas cópias dos objetos salvos (`{ ...obj }`), impedindo mutações acidentais fora da camada de serviço.

---

## 🛠️ Como Executar este Módulo Localmente

A partir do diretório raiz do repositório ou diretamente desta pasta:

```bash
# 1. Acesse o diretório do projeto
cd express/devlinks-express-api

# 2. Instale as dependências
npm install

# 3. Inicie o servidor em modo de desenvolvimento (Watch Mode)
npm run dev

```

O servidor estará escutando em **`http://localhost:5000`**.

---

## 📚 Documentação dos Endpoints

Base Path: `/api/v1/links`

| Método   | Endpoint        | Descrição                                                             | Status Sucesso |
| -------- | --------------- | --------------------------------------------------------------------- | -------------- |
| `GET`    | `/`             | Lista links. Aceita filtros via Query Params (ex: `?category=Dev`)    | `200 OK`       |
| `POST`   | `/`             | Cadastra um novo link. Gera `id` (UUID), `clicks: 0` e `createdAt`    | `201 Created`  |
| `GET`    | `/:id`          | Retorna os detalhes de um link específico                             | `200 OK`       |
| `PUT`    | `/:id`          | Atualiza os dados de um link preservando os metadados fixos           | `200 OK`       |
| `DELETE` | `/:id`          | Remove o link do repositório                                          | `200 OK`       |
| `GET`    | `/:id/redirect` | Incrementa o contador de `clicks` em +1 e executa HTTP Redirect (302) | `302 Found`    |

---

### Exemplo de Payload para Criação (`POST /api/v1/links`)

**Request Body:**

```json
{
  "title": "TypeScript Official Documentation",
  "url": "https://www.typescriptlang.org/docs/",
  "category": "Development",
  "tags": ["typescript", "javascript", "docs"]
}
```

**Response (`201 Created`):**

```json
{
  "message": "The link was created successfully",
  "link": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "title": "TypeScript Official Documentation",
    "url": "https://www.typescriptlang.org/docs/",
    "category": "Development",
    "tags": ["typescript", "javascript", "docs"],
    "clicks": 0,
    "createdAt": "2026-08-12T23:00:00.000Z"
  }
}
```

---

## ⚠️ Mapeamento de Erros da API

| Status Code              | Contexto                                                                   |
| ------------------------ | -------------------------------------------------------------------------- |
| **`400 Bad Request`**    | Formato de corpo inválido ou chaves de busca desconhecidas em `req.query`. |
| **`404 Not Found`**      | ID de link não localizado no repositório.                                  |
| **`409 Conflict`**       | Tentativa de registrar/atualizar uma URL que já pertence a outro registro. |
| **`500 Internal Error`** | Erro não mapeado do servidor (gera log interno de _stack trace_).          |

---

## 👤 Autor

Desenvolvido por **[João Gustavo Silva Lima](https://www.google.com/search?q=https://github.com/joao-gustavo-silva-lima)** no repositório [`node-express`](https://www.google.com/url?sa=E&source=gmail&q=https://github.com/joao-gustavo-silva-lima/node-express).

```

```
