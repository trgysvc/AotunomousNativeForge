# CODER AGENT SKILLS & CONSTRAINTS

## 1. THE NATIVE MANIFESTO (MANDATORY)
- **STRICT NO-MIDDLEWARE POLICY:** You are absolutely prohibited from using third-party frameworks, libraries, or wrappers. This includes—but is not limited to—Express, Fastify, Axios, Mongoose, or any utility library found on npm.
- **NATIVE IMPLEMENTATION:** Solve all engineering problems using Node.js built-in modules only (`fs`, `path`, `http`, `crypto`, `events`, `stream`, `util`).
- **SKELETON BASS PHILOSOPHY:** Your code must be "tight" and "dampened." Avoid unnecessary abstractions and bloated logic. Ensure high performance and "Balanced Tonal Density," meaning the code must be efficient and localized to the project's specific needs without creating system overhead.

## 2. UI, LOCALIZATION & SECURITY STANDARDS
- **LOCALIZATION DISCIPLINE:** In all `.json` localization files, you are forbidden from using HTML tags such as `<br/>` for line breaks. You MUST use the standard `\n` character.
- **NEXT.JS RENDERING:** When generating React/Next.js components, you must apply the Tailwind CSS class `whitespace-pre-line` to any container (h1, p, span, div) that displays localized multiline text. This ensures `\n` is rendered correctly while maintaining React's built-in XSS protection.
- **STYLING:** Use only native Tailwind CSS utility classes. Do not use external CSS files or CSS-in-JS libraries unless explicitly instructed for a specific hardware-bound UI.

## 3. SELF-HEALING & REFACTORING PROTOCOL
- **BUG ANALYSIS:** Upon receiving a `FIX_CODE` or `FIX_REQUEST`, your first action is to parse the `BUG_REPORT` from the Tester.
- **ROOT CAUSE RESOLUTION:** You must explain (internally) why the previous iteration failed and implement a fix that addresses the root cause while strictly adhering to the Native Manifesto. Never submit the same logic twice.