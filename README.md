# Node.js & Express

Welcome to my repository dedicated to mastering backend web development with **Node.js** and **Express**! This repository serves as a hands-on, "build-to-learn" workspace for immediate practical application of backend theories, architectural concepts, and network protocols through code snippets, targeted exercises, and standalone small projects.

## 🚀 Repository Overview

The repository is structured around two main core technologies— native **Node.js** fundamentals and **Express.js** application framework. Each section combines isolated theoretical code snippets (located inside `examples/` subdirectories) alongside full standalone micro-apps and tools (such as `devlinks-express-api` and `server-system-dashboard`) to validate knowledge absorption in practical scenarios.

### 📁 Project Structure

The repository follows a clean, modular hierarchy separating core runtime experimentation from framework-level implementations:

```text
node-express/
├── express/
│   ├── devlinks-express-api/   # Full-stack REST API implementation (has dedicated README)
│   ├── examples/               # Targeted code snippets for Express concepts
│   │   ├── static-files/       # Static assets serving demonstrations
│   │   ├── views/              # Template engines / views rendering
│   │   ├── app.1.ts            # Middleware & routing experiments
│   │   └── ...                 # Sequential Express module implementations
│   ├── express.d.ts            # Custom TypeScript type definitions
│   ├── package.json            # Dependencies for Express playground environment
│   └── tsconfig.json           # TypeScript configuration
│
└── node/
    ├── cli-system-and-file-analyzer/ # Standalone CLI tool
    ├── real-time-file-stream-and-event-... # Streams and events handling project
    ├── server-system-dashboard/ # System metrics monitoring server (has dedicated README)
    └── examples/               # Native Node.js foundational concepts
        ├── 001.js              # Native core execution
        ├── calculator.js       # Basic logic scripting
        ├── globals.js          # Node process & execution global context
        ├── http.js             # Native HTTP module without frameworks
        └── modules.js          # CommonJS / ESM module loading rules

```

---

## 🔑 Core Files & Directory Organization

When navigating through this laboratory, the structure is organized as follows:

1. 🧪 **`examples/` directories**: Contains standalone `.js` and `.ts` files (e.g., `app.1.ts`, `http.js`) designed for quick experiments, testing specific features (routing, native HTTP servers, middleware chains, streams, and file system operations).
2. 🛠️ **Small Projects**: Directories like `devlinks-express-api` and `server-system-dashboard` represent complete end-to-end applications, each equipped with its own dedicated **`README.md`** detailing specific setups, endpoints, and architectural decisions.
3. ⚙️ **`tsconfig.json` & `package.json**`: Provide the compilation rules, scripts (powered by `tsx`/`ts-node`), and dependency trees for executing both JavaScript and TypeScript scripts cleanly.

---

## 🛠️ Getting Started & How to Run

To execute any script or run the small projects locally, ensure you have **Node.js** (v18+ recommended) and **npm** installed.

### 1. Clone the Repository

```bash
git clone https://github.com/joao-gustavo-silva-lima/node-express.git
cd node-express

```

### 2. Running Snippets from `examples/`

Navigate to either the `node/` or `express/` environment and install dependencies:

```bash
cd express
npm install

```

Run any specific example script directly using Node or `tsx` (for TypeScript execution):

```bash
# Executing an Express TypeScript example
npx tsx examples/app.1.ts

# Executing a native Node.js JavaScript example
cd ../node
node examples/http.js

```

### 3. Running a Standalone Small Project

To explore a complete small project, navigate directly into its directory and follow its local instructions:

```bash
cd express/devlinks-express-api
npm install
npm run dev

```

---

## 📈 Goals

- **Native Node.js Fundamentals**: Understanding asynchronous I/O, event loops, stream processing, native HTTP servers, and file system interactions without external wrappers.
- **Express Framework Mastery**: Implementing RESTful APIs, robust middleware pipelines, route handling, error handling, and static file serving.
- **TypeScript Integration**: Building strongly-typed backend architectures using TypeScript, custom declaration files (`.d.ts`), and dynamic schema validations.
- **Practical Validation**: Transitioning from isolated theoretical snippets to structured micro-services and CLI tools to consolidate real-world software engineering practices.

Enjoy Coding! 🚀
