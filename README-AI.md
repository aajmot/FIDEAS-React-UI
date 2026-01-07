# 🤖 AI Coding Rules & Project Context

## 🛠 Tech Stack
- **Frontend:** React (Vite), Tailwind CSS, [e.g., Lucide React for icons]
- **Backend:** Python 3.11+, [e.g., FastAPI / Flask / Django]
- **Type Safety:** TypeScript (Frontend) & Pydantic/Type Hints (Backend)
- **Database/ORM:** [e.g., SQLAlchemy / Prisma]

---

## 🚦 Essential Rules (Must Follow)

### 1. Pre-Generation Analysis (The "Thinking" Rule)
Before writing code, output a `<thinking>` block. You must:
- List exactly which files you are about to modify.
- Identify the core logic steps.
- **Verify Dependencies:** State which libraries you are using and confirm they are standard or present in the repo (no ghost libraries).

### 2. React-Specific Constraints (Anti-Hallucination)
- **Hook Verification:** Do not invent hooks. Only use standard React hooks or those found in `src/hooks/`.
- **Component Limits:** Keep components under 150 lines. If it gets larger, suggest a split in your `<thinking>` block.
- **Tailwind Only:** Do not use inline styles or external CSS files unless specified. Use utility classes.
- **Strict Types:** Never use `any`. Define `interfaces` or `types` for all props and API responses.

### 3. Python-Specific Constraints (Efficiency)
- **Typing:** Use Python type hints (`List[str]`, `Optional[int]`) for all function signatures.
- **Async/Sync:** Be consistent with the project's async patterns. Do not mix `sync` and `async` libraries (e.g., don't use `requests` inside a FastAPI async route; use `httpx`).
- **Error Handling:** Use specific exceptions. Do not use bare `except: pass`.

### 4. Communication & Token Economy
- **Diff-Only:** If editing a file, only provide the changed code block with surrounding context. Do not rewrite a 200-line file to change 5 lines.
- **No Conversational "Fluff":** Skip "Sure, I can help." and "Let me know if you need more." Move straight to Analysis -> Code.
- **Validation:** If my request is ambiguous, **ask for clarification** instead of guessing and wasting tokens on a wrong solution.

---

## 📂 Context Map
- `/src/components`: UI components
- `/src/hooks`: Custom React hooks
- `/backend/app`: Main Python logic
- `/backend/models`: Database/Pydantic schemas