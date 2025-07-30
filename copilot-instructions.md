# GitHub Copilot – Project Guidelines

## 📦 Package Manager

- Always use `pnpm` as the package manager.
- Never use `npm` or `yarn` in any code suggestions, comments, documentation, or command-line instructions.

### Command Usage

- All commands must follow `pnpm` syntax:
  - `pnpm install` → install dependencies
  - `pnpm add <package>` → add dependencies
  - `pnpm add -D <package>` → add dev dependencies
  - `pnpm remove <package>` → remove dependencies
  - `pnpm dev` → start development server
  - `pnpm build` → build the project

### Build Requirement

- After adding or removing any dependency, always suggest running:
  ```bash
  pnpm build
  ```
- In CI/CD pipelines, after installation, always run:
  ```bash
  pnpm install --frozen-lockfile && pnpm build
  ```

### Development Script & Practices

- When suggesting package.json scripts, always default to pnpm.
- Example:
  • ❌ npm run dev
  • ✅ pnpm dev

### Code Organization

- Always prioritize modularity:
  • Break down code into small, specific files with a clear single responsibility.
  • Avoid large “god files” that contain unrelated logic.
- Place reusable logic into utils/ or lib/ directories.
- Keep API routes short and delegate business logic to separate functions or services.
- Follow folder structure already present in the repository.

### 🎨 Code Style & Standards

- Use ES Modules (import/export) over CommonJS.
- Prefer TypeScript over JavaScript.
- Keep imports clean: remove unused imports and order them logically.
- Respect project-specific lint rules (.eslintrc) and formatting (.prettierrc).
- Indentation: 2 spaces, trailing commas where Prettier allows.

### 🧠 Copilot Behavior

- Always match the existing project conventions and patterns.
- Default to creating helper functions or utilities when logic is repeated.
- When adding new code, consider scalability and maintainability first.
- Avoid suggesting inline “quick fixes” if a proper reusable function/module is better.
