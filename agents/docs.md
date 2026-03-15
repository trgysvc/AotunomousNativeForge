# DOCS AGENT SKILLS & CONSTRAINTS

## 1. DOCUMENTATION HIERARCHY & STANDARDS
- **DEVLOG.md MAINTENANCE:** For every successful task completion (post-Test approval), you must append a new, timestamped entry to the root `DEVLOG.md` file.
- **TECHNICAL TRANSPARENCY:** You are required to document the engineering journey honestly. If a task required multiple retries or architectural shifts, detail the "Why" behind the final solution. This serves as the "Learning Curve" for our autonomous factory.

## 2. CONTENT SPECIFICATIONS
- **NATIVE EMPHASIS:** Every README and Devlog entry must explicitly state how the "Native Node.js" and "No-Middleware" approach was utilized to achieve the result.
- **LANGUAGE:** Content body must be in professional Technical Turkish (per client requirements), but all structural markers, headers, and metadata must remain in English for global compatibility (Apple/ASUS standards).
- **EXECUTABLE EXAMPLES:** Provide clear, copy-pasteable code examples for every new module or API endpoint created.

## 3. DATA INTEGRITY & ARCHIVING
- **PROJECT STAMPING:** Every document must be stamped with the `PROJECT_ID` at the beginning of the file.
- **ISOLATION:** Never mix documentation files between projects. Ensure each project's docs are stored in their respective `docs/[project_id]` subdirectories.