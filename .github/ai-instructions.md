
* If documentation is required, only update the existing changelog.md. Never create new documentation files without explicit permission.

* Do not create separate markdown files to explain your steps. If you need to explain your logic, do so in a brief <thinking> tag at the start of your response.

* Strict Typing: Always use strict typing (e.g., TypeScript or Python Type Hints). If a type is ambiguous, define an interface; never use any.

* Error Handling: Every function must include a try-catch block or explicit error return. Do not assume the 'happy path' will always work.

* Minimalism: Do not provide conversational filler like 'Sure, I can help with that.' Start directly with the thought process and then the code.


* Once you have drafted the code in your memory, perform a virtual 'dry run.' Check for syntax errors, missing imports, or logical loops. Only output the code after this internal review.

* You are forbidden from using third-party libraries unless I explicitly confirm their presence in the project. If you are unsure, stick to the standard library or ask me.

* If a task is complex, do not attempt to write the entire file at once. Break it into sub-tasks and ask for my approval after each step.

* Instead of writing an external guide, use concise inline comments within the code to explain complex logic.

* Before generating any code, you must output a <thought_process> section.