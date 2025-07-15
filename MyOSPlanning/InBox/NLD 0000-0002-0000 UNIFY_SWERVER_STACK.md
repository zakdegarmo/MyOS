; NLD: UNIFY_SWERVER_STACK
; Directive_Type: NLD_ARCHITECTURE_MIGRATION
; Version: 1.0
; Target_Context: "Swerver_Desktop_Root"
; Purpose: "To migrate the correct Next.js frontend project into the main Swerver directory and unify the development workflow under a single command structure, achieving Phase 1 of NLD_PROJECT_ROADMAP."

; --- Parameters ---
; Source_Directory: "C:\Users\zakde\MyOSproject\user\WEBSITES\MyOS Website Next.js Project"
; Destination_Directory: "C:\Users\zakde\Desktop\Swerver"
; Archive_Target: "Swerver/frontend"
; New_Frontend_Name: "frontend"

; --- Micro_Actions ---

; 1. HALT_ALL_SERVICES
;    Action: "Ensure all running 'node' and 'vite' processes are stopped ('Ctrl + C' in all active terminals)."
;    Reason: "Prevents 'file in use' errors and ensures a clean state for file operations."

; 2. ARCHIVE_OLD_FRONTEND
;    Action: "In Destination_Directory, rename the existing 'frontend' folder to '_frontend_ARCHIVE'."
;    Reason: "Follows the 'no delete' safety protocol, preserving the old version as a backup."

; 3. COPY_NEW_FRONTEND
;    Action: "Copy the entire Source_Directory into the Destination_Directory."
;    Reason: "Migrates the correct, working Next.js project into the main Swerver ecosystem."

; 4. RENAME_MIGRATED_FOLDER
;    Action: "Rename the newly copied folder inside Destination_Directory to the value of New_Frontend_Name ('frontend')."
;    Reason: "Establishes the final, clean directory structure."

; 5. INSTALL_ORCHESTRATOR_TOOL
;    Action: "From a terminal in the root of Destination_Directory, run 'npm install -D concurrently'."
;    Reason: "Installs the 'foreman' tool needed to run multiple services with one command."

; 6. UNIFY_PACKAGE_SCRIPTS
;    Action: "In the root 'package.json' of Destination_Directory, replace the entire 'scripts' section with the following:"
;    Code: {
;      "scripts": {
;        "start": "node Swerver.js",
;        "dev:backend": "node Swerver.js",
;        "dev:frontend": "npm run dev --prefix frontend",
;        "dev": "concurrently \"npm:dev:*\""
;      }
;    }
;    Reason: "Creates the unified 'npm run dev' command that starts both backend and frontend simultaneously."

; --- Expected_Outcome ---
; "Running the single command 'npm run dev' from the Swerver root will successfully launch both the backend Swerver.js and the Next.js frontend dev server. The project will be unified in a single, manageable directory."

; Weave_Signature: NLD-UNIFY-STACK-V1-20250705T140211