; NLD 002 - STACK_UNIFICATION_DEBUG_LOG
; Directive_Type: NLD_AFTER_ACTION_REPORT
; Version: 1.0
; Target_Context: "Swerver_Stack_V2 Migration"
; Purpose: "To document the debugging process undertaken to resolve architectural conflicts and stabilize the unified Swerver project, serving as a record for future instances."

; --- Parameters ---
; Start_State: "Multiple fragmented projects (Vite, Next.js, Node.js) with conflicting dependencies and configurations."
; End_State: "A single, unified Swerver project with a running backend orchestrator and a compiling Next.js frontend."

; --- Micro_Actions (Problems & Resolutions) ---

; 1. CONFLICT: 'vite' command not recognized.
;    REASON: "Root package.json 'dev' script was a placeholder. Vite devDependency was not installed at the root level."
;    RESOLUTION: "Updated 'dev' script to 'vite'; ran 'npm install' at root to install necessary packages."

; 2. CONFLICT: Next.js build error: "Module not found: Can't resolve '@/components/PillarScene'".
;    REASON: "A 'ghost path' from the old project structure was cached in the '.next' folder and defined incorrectly in 'tsconfig.json'."
;    RESOLUTION: "Deleted 'frontend/node_modules' and 'frontend/.next' to clear cache. Replaced 'tsconfig.json' with a version where the '@/*' path alias points to the correct 'frontend' root."

; 3. CONFLICT: Multiple Content Security Policy (CSP) errors blocking scripts and services (Firebase, Google Fonts, Tailwind CDN, inline styles).
;    REASON: "The CSP <meta> tag in index.html was malformed (due to newlines) and too restrictive for the application's needs."
;    RESOLUTION: "Replaced the malformed tag with a complete, single-line CSP string that explicitly allows all required external and inline sources for a development environment."

; 4. CONFLICT: Next.js runtime error: "Couldn't find any 'pages' or 'app' directory."
;    REASON: "The project's 'app' directory was nested inside a 'src' folder, but the default Next.js configuration expects it at the project root."
;    RESOLUTION: "Restructured the 'frontend' directory by moving the contents of 'src' (app, components, lib) to the root of 'frontend' and deleting the now-empty 'src' folder."

; --- Expected_Outcome ---
; "All major structural and configuration errors are resolved. The system is stable and ready for feature development, starting with the integration of the video splash page."

; Weave_Signature: NLD-AAR-JANKSLAYING-V1-20250705T193510