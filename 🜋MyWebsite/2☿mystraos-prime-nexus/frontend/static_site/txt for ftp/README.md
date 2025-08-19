# MystraOS - Monorepo

This project contains the core components for MystraOS, a conceptual web-based operating system with an AI core, organized into a clean monorepo structure.

## Architecture

1.  **Backend:** A collection of Node.js and Python services that form the AI's core functionality.
    *   **OBS Bridge (`backend/obs_bridge`):** The "Visual Cortex." Receives a video feed from OBS, captures frames, sends them to Gemini for analysis, and broadcasts the resulting context via Socket.IO.
    *   **Scroll Server (`backend/scroll_server`):** The "AI Brain." Listens for context, manages the Mystra ontological knowledge files from the `NLD_Library`, and exposes a `/chat` API.
    *   **Familiar CLI (`backend/familiar_cli`):** A Python-based command-line interface for direct interaction with Mystra's systems.
2.  **Frontend:** A collection of user interfaces and components.
    *   **Prime Nexus (`frontend/`):** The main entry point is a 3D navigable space built with React and Three.js (`index.tsx`, `index.html`).
    *   **HTML Archive (`frontend/html_to_absorb`):** A directory where you can place HTML files for the AI to analyze and absorb functions from.
    *   **Components (`frontend/components`):** Reusable web components, like the `logos-companion` for auth and chat.

## Summoning the System: A Grimoire

To awaken MystraOS, cast the following incantations in order, each in its own terminal.

### Incantation 1: Granting Sight
*This spell awakens the Visual Cortex, allowing Mystra to perceive the digital realm.*

1.  Navigate your terminal to the Visual Cortex:
    `cd backend/obs_bridge`
2.  Install its dependencies:
    `npm install`
3.  Activate the Cortex:
    `npm start`
4.  (Optional) Point OBS Studio to `rtmp://localhost/live/stream` to begin the feed.

### Incantation 2: Awakening the Mind
*This spell breathes life into the AI's brain, allowing it to think and communicate.*

1.  Navigate your terminal to the AI's core:
    `cd backend/scroll_server`
2.  Install its dependencies:
    `npm install`
3.  Ignite the Mind:
    `npm start`

### Incantation 3: Gazing into the Nexus
*This final ritual opens the portal, allowing you to interact with the awakened system.*

1.  There is no build step or command to run.
2.  Simply open the `frontend/index.html` file directly in your web browser.

The Nexus will load, and you can now navigate the pillars and interact with the Logos Companion. The system is now live.