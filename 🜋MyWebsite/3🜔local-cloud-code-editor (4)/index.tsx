import React, {
  useState,
  useCallback,
  DragEvent,
  useEffect,
  useRef,
} from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI, Chat } from "@google/genai";
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-json';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

type FileSystem = Record<string, string>;

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

interface LibraryFunction {
  id: string;
  name: string;
  description: string;
  code: string;
  tags: string[];
}

const INITIAL_THEME = {
    background: '#1a1b26',
    surface: '#24283b',
    foreground: '#c0caf5',
    primary: '#7aa2f7',
    'primary-hover': '#9eceff',
    secondary: '#bb9af7',
    'secondary-hover': '#c7aeff',
    accent: '#7dcfff',
    selection: '#414868',
    comment: '#5c6370',
    danger: '#f7768e',
};

const LANGUAGE_TEMPLATES: Record<string, FileSystem> = {
  "vanilla-js": {
    "index.html": `<!DOCTYPE html>
<html>
  <head>
    <title>My App</title>
    <link rel="stylesheet" href="styles.css">
  </head>
  <body>
    <h1>Welcome</h1>
    <script src="main.js"></script>
  </body>
</html>`,
    "main.js": `// Welcome to your Cloud Code Editor!
// Use the "Add to Library" button to absorb this function.
function greet(name) {
  const message = 'Hello, ' + name + '!';
  console.log(message);
  return message;
}

greet('World');
`,
    "styles.css": `body {
  font-family: sans-serif;
  background-color: #f0f0f0;
}`,
  },
  "react-component": {
    "Component.tsx": `import React from 'react';
import './styles.css';

interface ComponentProps {
  name: string;
}

const Component: React.FC<ComponentProps> = ({ name }) => {
  return (
    <div className="container">
      <h1>Hello, {name}!</h1>
      <p>This is a simple React component.</p>
    </div>
  );
};

export default Component;
`,
    "styles.css": `.container {
  padding: 2rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  text-align: center;
}`,
  },
  "python-script": {
    "main.py": `# A simple Python script
import os

def get_user():
    return os.getenv("USER", "World")

def main():
    user = get_user()
    print(f"Hello, {user} from Python!")

if __name__ == "__main__":
    main()
`,
  },
  "go-program": {
    "main.go": `package main

import "fmt"

// A simple Go program
func main() {
    fmt.Println(getGreeting())
}

func getGreeting() string {
    return "Hello, World from Go!"
}
`,
  },
};

const getPrismLanguage = (filename: string) => {
  const extension = filename.split('.').pop();
  switch (extension) {
    case 'js':
    case 'mjs':
      return Prism.languages.javascript;
    case 'jsx':
      return Prism.languages.jsx;
    case 'ts':
      return Prism.languages.typescript;
    case 'tsx':
      return Prism.languages.tsx;
    case 'css':
      return Prism.languages.css;
    case 'py':
      return Prism.languages.python;
    case 'go':
      return Prism.languages.go;
    case 'json':
      return Prism.languages.json;
    case 'html':
      return Prism.languages.markup;
    default:
      return Prism.languages.clike;
  }
};

const App = () => {
  const [currentTemplate, setCurrentTemplate] = useState<string>("vanilla-js");
  const [files, setFiles] = useState<FileSystem>(
    LANGUAGE_TEMPLATES[currentTemplate]
  );
  const [activeFile, setActiveFile] = useState<string>(
    Object.keys(LANGUAGE_TEMPLATES[currentTemplate])[1] ||
      Object.keys(LANGUAGE_TEMPLATES[currentTemplate])[0]
  );
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [chat, setChat] = useState<Chat | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [library, setLibrary] = useState<LibraryFunction[]>([]);
  const [librarySearch, setLibrarySearch] = useState("");
  const [theme, setTheme] = useState(INITIAL_THEME);
  const [themeHistory, setThemeHistory] = useState([INITIAL_THEME]);
  const chatHistoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(theme).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
  }, [theme]);

  useEffect(() => {
    try {
      const savedLibrary = localStorage.getItem("ai-buddy-library");
      if (savedLibrary) {
        setLibrary(JSON.parse(savedLibrary));
      }
    } catch (error) {
      console.error("Failed to load library from localStorage", error);
      setLibrary([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("ai-buddy-library", JSON.stringify(library));
    } catch (error) {
      console.error("Failed to save library to localStorage", error);
    }
  }, [library]);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [chatHistory]);

  useEffect(() => {
    if (!activeFile) {
      setChat(null);
      setChatHistory([]);
      return;
    }

    const newChat = ai.chats.create({
      model: "gemini-2.5-flash-preview-04-17",
      config: { responseMimeType: "application/json" },
    });
    setChat(newChat);
    setChatHistory([
      {
        role: "model",
        text: `Hi! I'm AI_Buddy. I'm looking at \`${activeFile}\` and I'm aware of your function library. How can I help? You can ask me to change the code or even change the UI theme.`,
      },
    ]);
  }, [activeFile]);

  const handleFileContentChange = (newContent: string) => {
    setFiles((prev) => ({ ...prev, [activeFile]: newContent }));
  };

  const handleTemplateChange = (templateKey: string) => {
    if (!LANGUAGE_TEMPLATES[templateKey]) return;
    const newFiles = LANGUAGE_TEMPLATES[templateKey];
    setCurrentTemplate(templateKey);
    setFiles(newFiles);
    const preferredFile =
      Object.keys(newFiles).find((f) =>
        /^(main|component)\.(js|tsx|py|go)$/i.test(f)
      ) || Object.keys(newFiles)[0];
    setActiveFile(preferredFile);
  };

  const handleSendMessage = useCallback(async () => {
    if (!aiPrompt.trim() || !chat || !activeFile) return;

    const userMessage: ChatMessage = { role: "user", text: aiPrompt };
    setChatHistory((prev) => [...prev, userMessage]);
    setAiPrompt("");
    setIsLoading(true);

    const currentCode = files[activeFile];
    const libraryContext =
      library.length > 0
        ? `
The user has a personal library of functions they have saved. You should use these functions if they are relevant to the user's request. Here is the library:
--- LIBRARY START ---
${library
  .map(
    (f) =>
      `// Function: ${f.name}\n// Description: ${
        f.description
      }\n// Tags: ${f.tags.join(", ")}\n${f.code}`
  )
  .join("\n\n")}
--- LIBRARY END ---
`
        : "";

    const fullPrompt = `You are AI_Buddy, an expert pair programmer and UI assistant.
${libraryContext}
The user is currently editing the file named "${activeFile}".
Here is the current code in the file:
---
${currentCode}
---
The user's request is: "${aiPrompt}"

Your task is to respond to the user's request.
If the user asks to change the UI theme or colors, include a "theme" object in your response. The keys should be the CSS variable names (without "--") and the values should be the new color codes (e.g., {"primary": "#ff9900", "background": "#111111"}). Possible keys are: background, surface, foreground, primary, primary-hover, secondary, secondary-hover, accent, selection, comment, danger. Only include the keys for the colors you are changing.

You MUST respond with a JSON object. The JSON object must have three fields:
1.  "reply" (string): A friendly, conversational reply to the user.
2.  "code" (string | null): If the user's request requires changing the code, this field MUST contain the complete, new code for the entire file. If no code changes are needed, this field should be null.
3.  "theme" (object | null): If the user's request requires changing the theme, this field should contain the theme object as described above. Otherwise, it should be null.`;

    try {
      const response = await chat.sendMessage({ message: fullPrompt });
      let jsonStr = response.text.trim();
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) {
        jsonStr = match[2].trim();
      }

      const parsed = JSON.parse(jsonStr);
      let replyText = parsed.reply;
      
      if (parsed.theme && typeof parsed.theme === 'object' && Object.keys(parsed.theme).length > 0) {
        const newTheme = { ...theme, ...parsed.theme };
        setTheme(newTheme);
        setThemeHistory(prev => [...prev, newTheme]);
        replyText += "\n\nI've also updated your UI theme as requested.";
      }
      
      const aiMessage: ChatMessage = { role: "model", text: replyText };
      setChatHistory((prev) => [...prev, aiMessage]);

      if (parsed.code !== null && parsed.code !== undefined) {
        handleFileContentChange(parsed.code);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: ChatMessage = {
        role: "model",
        text: "Sorry, I ran into an error. Please check the console for details.",
      };
      setChatHistory((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [aiPrompt, chat, activeFile, files, library, theme]);

  const handleAddFileToLibrary = useCallback(async () => {
    if (!activeFile) return;
    setIsLoading(true);
    const thinkingMessage: ChatMessage = {
      role: "model",
      text: `Analyzing \`${activeFile}\` to add functions to your library...`,
    };
    setChatHistory((prev) => [...prev, thinkingMessage]);

    const currentCode = files[activeFile];

    try {
      const fullPrompt = `You are an expert code analysis AI. Analyze the code in "${activeFile}" and extract every function.
For each function, provide its name, a concise one-sentence description of its purpose, its complete source code, and a list of conceptual tags.
Tags should be lowercase, single-word or kebab-case strings that describe the function's domain, purpose, or the technology it uses (e.g., "api-call", "dom-manipulation", "math", "sorting-algorithm", "validation").

You MUST respond with a JSON array of objects. Each object must have "name", "description", "code", and "tags" fields.
Example response:
[
  {
    "name": "greet",
    "description": "Logs a greeting message to the console for a given name.",
    "code": "function greet(name) {\\n  const message = 'Hello, ' + name + '!';\\n  console.log(message);\\n  return message;\\n}",
    "tags": ["dom", "string-manipulation", "logging"]
  }
]
If there are no functions in the code, return an empty array [].
Do not output any other text, markdown, or explanations. Only the JSON array.
---
Code to analyze:
${currentCode}
---
`;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-04-17",
        contents: fullPrompt,
        config: { responseMimeType: "application/json" },
      });

      let jsonStr = response.text.trim();
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) {
        jsonStr = match[2].trim();
      }

      const parsedFns = JSON.parse(jsonStr);

      if (!Array.isArray(parsedFns)) {
        throw new Error("AI did not return a valid array of functions.");
      }

      const newFunctions = parsedFns.map((f) => ({
        ...f,
        id: self.crypto.randomUUID(),
        tags: f.tags || [],
      }));

      let addedCount = 0;
      setLibrary((prev) => {
        const existingNames = new Set(prev.map((f) => f.name));
        const functionsToAdd = newFunctions.filter(
          (f) => f.name && !existingNames.has(f.name)
        );
        addedCount = functionsToAdd.length;
        return [...prev, ...functionsToAdd];
      });

      setChatHistory((prev) => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1] = {
          role: "model",
          text:
            addedCount > 0
              ? `Success! Added ${addedCount} new function${
                  addedCount > 1 ? "s" : ""
                } to your library.`
              : `I analyzed the file, but didn't find any new functions to add.`,
        };
        return newHistory;
      });
    } catch (error) {
      console.error("Error adding to library:", error);
      setChatHistory((prev) => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1] = {
          role: "model",
          text: "Sorry, an error occurred while analyzing the file. Please check the console.",
        };
        return newHistory;
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeFile, files]);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    droppedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (readEvent) => {
        const content = readEvent.target?.result as string;
        setFiles((prev) => ({ ...prev, [file.name]: content }));
        setActiveFile(file.name);
      };
      reader.readAsText(file);
    });
  };

  const handleDownloadFile = (filename: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const content = files[filename];
    if (content === undefined) return;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRemoveFromLibrary = (idToRemove: string) => {
    setLibrary((prev) => prev.filter((fn) => fn.id !== idToRemove));
  };
  
  const handleUndoTheme = () => {
    if (themeHistory.length > 1) {
      const newHistory = [...themeHistory];
      newHistory.pop(); // remove current
      const lastTheme = newHistory[newHistory.length - 1];
      setTheme(lastTheme);
      setThemeHistory(newHistory);
    }
  };


  const filteredLibrary = library.filter((fn) => {
    if (!librarySearch) return true;
    const searchTerm = librarySearch.toLowerCase();

    const nameMatch = fn.name.toLowerCase().includes(searchTerm);
    const descriptionMatch = fn.description.toLowerCase().includes(searchTerm);
    const tagMatch = fn.tags.some((tag) => tag.toLowerCase().includes(searchTerm));

    return nameMatch || descriptionMatch || tagMatch;
  });

  return (
    <div
      className="app-wrapper"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="drag-overlay">
          <p>Drop files to add them to the workspace</p>
        </div>
      )}
      <div className="app-container">
        <div className="file-explorer">
          <div className="file-explorer-header">WORKSPACE</div>
          <div className="template-selector-container">
            <select
              className="template-selector"
              value={currentTemplate}
              onChange={(e) => handleTemplateChange(e.target.value)}
              aria-label="Select a project template"
            >
              <option value="vanilla-js">Vanilla JS Project</option>
              <option value="react-component">React Component</option>
              <option value="python-script">Python Script</option>
              <option value="go-program">Go Program</option>
            </select>
          </div>
          <ul className="file-list">
            {Object.keys(files).map((filename) => (
              <li
                key={filename}
                className={`file-item ${
                  activeFile === filename ? "active" : ""
                }`}
                onClick={() => setActiveFile(filename)}
                role="button"
                tabIndex={0}
                aria-current={activeFile === filename}
              >
                <div className="file-info">
                  <span className="file-item-icon">📄</span>
                  {filename}
                </div>
                <button
                  className="download-button"
                  onClick={(e) => handleDownloadFile(filename, e)}
                  title={`Download ${filename}`}
                  aria-label={`Download ${filename}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="main-content">
          <div className="editor-pane">
            <Editor
              value={files[activeFile] || ""}
              onValueChange={code => handleFileContentChange(code)}
              highlight={code => Prism.highlight(code, getPrismLanguage(activeFile), activeFile.split('.').pop() || 'clike')}
              padding={16}
              className="editor"
              textareaClassName="editor-textarea"
              preClassName="editor-pre"
              aria-label={`Code editor for ${activeFile}`}
              placeholder="Drop a file here or select one from the workspace"
            />
          </div>
          <div className="ai-terminal">
            <div className="chat-history" ref={chatHistoryRef}>
              {chatHistory.map((msg, index) => (
                <div key={index} className={`chat-message ${msg.role}-message`}>
                  <div className="message-bubble">{msg.text}</div>
                </div>
              ))}
              {isLoading && (
                <div className="chat-message model-message">
                  <div className="message-bubble">
                    <span className="loader">AI Buddy is thinking...</span>
                  </div>
                </div>
              )}
            </div>
            <div className="chat-input-area">
              <textarea
                className="ai-prompt-input"
                placeholder="Chat with AI Buddy..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                disabled={isLoading || !activeFile}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !isLoading) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={1}
              />
              <div className="ai-button-group">
                <button
                  className="ai-send-button"
                  onClick={handleSendMessage}
                  disabled={isLoading || !aiPrompt.trim()}
                  aria-label="Send message"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m22 2-7 20-4-9-9-4Z" />
                    <path d="m22 2-11 11" />
                  </svg>
                </button>
                <button
                  className="ai-library-button"
                  onClick={handleAddFileToLibrary}
                  disabled={isLoading || !activeFile}
                  title="Analyze the current file and add its functions to your personal library."
                >
                  Add to Library
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="function-library">
          <div className="library-header">FUNCTION LIBRARY</div>
          <div className="library-controls">
            <input
              type="search"
              placeholder="Search library..."
              className="library-search-input"
              value={librarySearch}
              onChange={(e) => setLibrarySearch(e.target.value)}
            />
             <button
                className="undo-theme-button"
                onClick={handleUndoTheme}
                disabled={themeHistory.length <= 1}
                title="Undo last theme change"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l-3 2.7"/></svg>
                Undo Theme
            </button>
          </div>
          {library.length === 0 ? (
            <div className="library-empty-state">
              <p>Your library is empty.</p>
              <p>
                Open a file and use "Add to Library" to start building your
                collection of reusable functions.
              </p>
            </div>
          ) : (
            <ul className="library-list">
              {filteredLibrary.map((fn) => (
                <li key={fn.id} className="library-item">
                  <div className="library-item-header">
                    <span className="library-item-name">{fn.name}</span>
                    <button
                      className="library-item-remove"
                      onClick={() => handleRemoveFromLibrary(fn.id)}
                      title="Remove from library"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="library-item-description">{fn.description}</p>
                   <div className="library-item-tags">
                      {fn.tags.map(tag => (
                        <span key={tag} className="library-item-tag">{tag}</span>
                      ))}
                    </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root"));
root.render(<App />);