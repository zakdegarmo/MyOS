// js/logos-companion.js
import { initializeApp } from "firebase/app";
import { 
    getAuth, 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut 
} from "firebase/auth";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDr-NIzZaz8vXZ8umXk_45MlNp6HoBXwkQ", // YOUR ACTUAL KEY
  authDomain: "mystraos.firebaseapp.com",
  projectId: "mystraos",
  storageBucket: "mystraos.firebasestorage.app",
  messagingSenderId: "912155809484",
  appId: "1:912155809484:web:deb84563d00da8fed7d469",
  measurementId: "G-4CZ7450X8J"
};

class LogosCompanion extends HTMLElement {
    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: 'open' });

        shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: 'Inter', sans-serif;
                }
                .hidden { display: none !important; }
                .auth-container {
                    background-color: rgba(23, 29, 45, 0.9);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 20px;
                    border-radius: 12px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                    color: #E2E8F0;
                    width: 380px;
                    max-height: 80vh;
                    display: flex;
                    flex-direction: column;
                }
                .auth-container h3, .auth-container h4 {
                    color: #A5B4FC;
                    margin-top: 0;
                    margin-bottom: 10px;
                    text-align: center;
                }
                 .auth-container input, .auth-container button, .auth-container textarea {
                    width: 100%;
                    padding: 10px;
                    margin-bottom: 10px;
                    border-radius: 4px;
                    border: 1px solid #4A5568;
                    background-color: #2D3748;
                    color: #E2E8F0;
                    font-size: 0.95em;
                    box-sizing: border-box;
                }
                .auth-container input:focus, .auth-container textarea:focus {
                    outline: none;
                    border-color: #4F46E5;
                    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.5);
                }
                .auth-container button {
                    background-color: #4F46E5;
                    cursor: pointer;
                    font-weight: 500;
                    transition: background-color 0.2s;
                }
                .auth-container button:hover:not(:disabled) {
                    background-color: #4338CA;
                }
                 .auth-container button:disabled {
                    background-color: #374151;
                    cursor: not-allowed;
                }
                #auth-status, #library-status {
                    font-size: 0.9em;
                    margin-bottom: 15px;
                    min-height: 20px;
                    text-align: center;
                    color: #94a3b8;
                }
                
                /* Section Styles */
                .section {
                    margin-top: 15px;
                    border-top: 1px solid #4A5568;
                    padding-top: 15px;
                }
                
                /* Chat UI Styles */
                #chat-section {
                    display: flex;
                    flex-direction: column;
                    flex-grow: 1;
                    min-height: 250px;
                }
                .chat-output-area {
                    flex-grow: 1;
                    overflow-y: auto;
                    border: 1px solid #4A5568;
                    background-color: #1A202C;
                    padding: 10px;
                    margin-bottom: 10px;
                    border-radius: 4px;
                    min-height: 150px;
                    max-height: 300px;
                }
                .chat-output-area p {
                    margin: 0 0 8px 0;
                    font-size: 0.9em;
                    word-wrap: break-word;
                    line-height: 1.4;
                }
                .chat-output-area strong { color: #818CF8; }
                #chat-input { height: 60px; resize: none; }

                /* AI Tools & Library Styles */
                #library-display {
                    max-height: 250px;
                    overflow-y: auto;
                    padding: 4px;
                    background-color: #1a202c;
                    border-radius: 4px;
                }
                .library-item {
                    background-color: #2d3748;
                    border: 1px solid #4a5568;
                    padding: 8px;
                    margin-bottom: 8px;
                    border-radius: 4px;
                }
                .library-item-header { font-weight: bold; color: #a5b4fc;}
                .library-item-desc { font-size: 0.85em; color: #cbd5e1; margin: 4px 0; }
                .library-item-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
                .library-item-tag { background-color: #4a5568; font-size: 0.75em; padding: 2px 6px; border-radius: 10px; }
            </style>

            <div id="auth-container" class="auth-container">
                <h3>MystraAuth</h3>
                <div id="auth-status">Initializing...</div>
                <div id="auth-form">
                    <input type="email" id="auth-email" placeholder="Email">
                    <input type="password" id="auth-password" placeholder="Password">
                    <button id="auth-login-btn">Log In</button>
                    <button id="auth-register-btn">Sign Up</button>
                </div>
                <button id="auth-logout-btn" class="hidden">Logout</button>

                <div id="main-content" class="hidden">
                    <!-- Chat UI -->
                    <div id="chat-section" class="section">
                        <h4>Chat with Mystra</h4>
                        <div id="chat-output" class="chat-output-area"></div>
                        <textarea id="chat-input" placeholder="Type your message..."></textarea>
                        <button id="chat-send-btn">Send</button>
                    </div>

                    <!-- AI Developer Tools UI -->
                    <div id="ai-tools-section" class="section">
                        <h4>AI Developer Tools</h4>
                        <input type="text" id="tools-url-input" placeholder="Enter URL to analyze...">
                        <button id="tools-analyze-btn">Analyze & Absorb Functions</button>
                        <div id="library-status"></div>
                        <div id="library-display"></div>
                    </div>
                </div>
            </div>
        `;

        // Auth elements
        this.authContainer = shadowRoot.getElementById('auth-container');
        this.authStatusDiv = shadowRoot.getElementById('auth-status');
        this.authForm = shadowRoot.getElementById('auth-form');
        this.authEmailInput = shadowRoot.getElementById('auth-email');
        this.authPasswordInput = shadowRoot.getElementById('auth-password');
        this.authLoginBtn = shadowRoot.getElementById('auth-login-btn');
        this.authRegisterBtn = shadowRoot.getElementById('auth-register-btn');
        this.authLogoutBtn = shadowRoot.getElementById('auth-logout-btn');
        this.mainContent = shadowRoot.getElementById('main-content');
        
        // Chat elements
        this.chatSection = shadowRoot.getElementById('chat-section');
        this.chatOutput = shadowRoot.getElementById('chat-output');
        this.chatInput = shadowRoot.getElementById('chat-input');
        this.chatSendBtn = shadowRoot.getElementById('chat-send-btn');

        // Tools elements
        this.toolsUrlInput = shadowRoot.getElementById('tools-url-input');
        this.toolsAnalyzeBtn = shadowRoot.getElementById('tools-analyze-btn');
        this.libraryStatus = shadowRoot.getElementById('library-status');
        this.libraryDisplay = shadowRoot.getElementById('library-display');
        
        this.currentUserToken = null;
        this.functionLibrary = [];

        try {
            this.firebaseApp = initializeApp(firebaseConfig); 
            this.firebaseAuth = getAuth(this.firebaseApp); 
            this.initAuthentication(); 
        } catch (error) {
            console.error("Error initializing Firebase in LogosCompanion:", error);
            if (this.authStatusDiv) this.authStatusDiv.textContent = "Firebase init failed.";
        }
        
        this.loadLibraryFromStorage();
        this.bindEventListeners();
    }
    
    bindEventListeners() {
        this.authLoginBtn.addEventListener('click', () => this.handleAuth('login'));
        this.authRegisterBtn.addEventListener('click', () => this.handleAuth('register'));
        this.authLogoutBtn.addEventListener('click', () => this.handleAuth('logout'));
        this.chatSendBtn.addEventListener('click', () => this.sendMessage());
        this.toolsAnalyzeBtn.addEventListener('click', () => this.handleAnalyzeCode());

        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }

    initAuthentication() {
        if (!this.firebaseApp || !this.firebaseAuth) {
             this.authStatusDiv.textContent = "Firebase SDK failed to initialize.";
             return;
        }
        this.authStatusDiv.textContent = "Firebase SDK initialized.";
        onAuthStateChanged(this.firebaseAuth, user => this.updateAuthState(user));
    }

    async updateAuthState(user) {
        if (user) {
            const userDisplayName = user.email ? user.email.split('@')[0] : 'User';
            this.authStatusDiv.textContent = `Logged in as: ${userDisplayName}`;
            this.authForm.classList.add('hidden');
            this.authLogoutBtn.classList.remove('hidden');
            this.mainContent.classList.remove('hidden');
            
            try {
                this.currentUserToken = await user.getIdToken();
                console.log(`User logged in: ${user.uid}. ID Token acquired.`);
            } catch (error) {
                console.error("Error getting ID token:", error);
                this.currentUserToken = null;
                this.displayMessage('System', `Error getting ID token: ${error.message}`);
            }
        } else {
            this.authStatusDiv.textContent = "Logged out.";
            this.authForm.classList.remove('hidden');
            this.authLogoutBtn.classList.add('hidden');
            this.mainContent.classList.add('hidden');
            this.authEmailInput.value = '';
            this.authPasswordInput.value = '';
            this.currentUserToken = null;
            this.chatOutput.innerHTML = '';
        }
    }

    async handleAuth(type) {
        const email = this.authEmailInput.value;
        const password = this.authPasswordInput.value;

        if (type !== 'logout' && (!email || !password)) {
            this.authStatusDiv.textContent = "Please enter email and password.";
            return;
        }

        this.authStatusDiv.textContent = "Processing...";
        try {
            if (type === 'login') await signInWithEmailAndPassword(this.firebaseAuth, email, password);
            else if (type === 'register') await createUserWithEmailAndPassword(this.firebaseAuth, email, password);
            else if (type === 'logout') await signOut(this.firebaseAuth);
        } catch (error) {
            this.authStatusDiv.textContent = `Auth Error: ${error.code}`;
        }
    }

    displayMessage(sender, messageText) {
        const messageElement = document.createElement('p');
        messageElement.innerHTML = `<strong>${sender}:</strong> `;
        messageElement.appendChild(document.createTextNode(messageText));
        this.chatOutput.appendChild(messageElement);
        this.chatOutput.scrollTop = this.chatOutput.scrollHeight;
    }

    async sendMessage() {
        const messageText = this.chatInput.value.trim();
        if (!messageText) return;

        const userDisplayName = (this.firebaseAuth.currentUser?.email?.split('@')[0]) || 'You';
        this.displayMessage(userDisplayName, messageText);
        this.chatInput.value = '';
        this.chatInput.focus();

        try {
            const headers = { 'Content-Type': 'application/json' };
            if (this.currentUserToken) headers['Authorization'] = `Bearer ${this.currentUserToken}`;

            const response = await fetch('http://localhost:8080/chat', { 
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ message: messageText })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ reply: `Server error: ${response.status}` }));
                throw new Error(errorData.reply || `HTTP error ${response.status}`);
            }

            const data = await response.json();
            this.displayMessage('Mystra', data.reply);
        } catch (error) {
            this.displayMessage('System', `Error: ${error.message}`);
        }
    }

    async handleAnalyzeCode() {
        const url = this.toolsUrlInput.value.trim();
        if (!url) {
            this.libraryStatus.textContent = "Please enter a URL.";
            return;
        }

        this.libraryStatus.textContent = "Fetching page content...";
        try {
            // Fetch the content of the page
            const pageResponse = await fetch(url);
            if (!pageResponse.ok) throw new Error(`Failed to fetch URL: ${pageResponse.statusText}`);
            const code = await pageResponse.text();

            this.libraryStatus.textContent = "Analyzing code with Mystra...";
            
            // Send the code to the backend for analysis
            const analyzeResponse = await fetch('http://localhost:8080/extract-functions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });

            if (!analyzeResponse.ok) {
                const errorData = await analyzeResponse.json().catch(() => ({ error: "Unknown server error during analysis." }));
                 throw new Error(errorData.error);
            }
            
            const newFunctions = await analyzeResponse.json();

            if (!Array.isArray(newFunctions)) {
                 throw new Error("AI analysis did not return a valid function array.");
            }
            
            let addedCount = 0;
            const existingNames = new Set(this.functionLibrary.map(f => f.name));
            newFunctions.forEach(fn => {
                if(fn.name && !existingNames.has(fn.name)) {
                    this.functionLibrary.push(fn);
                    addedCount++;
                }
            });

            this.saveLibraryToStorage();
            this.renderLibrary();
            this.libraryStatus.textContent = `Success! Added ${addedCount} new function(s) to your library.`;

        } catch(error) {
            console.error("Analysis failed:", error);
            this.libraryStatus.textContent = `Error: ${error.message}`;
        }
    }

    renderLibrary() {
        this.libraryDisplay.innerHTML = '';
        if (this.functionLibrary.length === 0) {
            this.libraryDisplay.innerHTML = `<p>Your library is empty.</p>`;
            return;
        }
        this.functionLibrary.forEach(fn => {
            const item = document.createElement('div');
            item.className = 'library-item';
            
            const tagsHtml = fn.tags.map(tag => `<span class="library-item-tag">${tag}</span>`).join('');
            
            item.innerHTML = `
                <div class="library-item-header">${fn.name}</div>
                <div class="library-item-desc">${fn.description}</div>
                <div class="library-item-tags">${tagsHtml}</div>
            `;
            this.libraryDisplay.appendChild(item);
        });
    }
    
    loadLibraryFromStorage() {
        try {
            const saved = localStorage.getItem('mystra-function-library');
            if (saved) {
                this.functionLibrary = JSON.parse(saved);
                this.renderLibrary();
                this.libraryStatus.textContent = `Loaded ${this.functionLibrary.length} function(s) from local storage.`;
            }
        } catch(e) {
            console.error("Failed to load library from storage", e);
            this.functionLibrary = [];
        }
    }

    saveLibraryToStorage() {
        try {
            localStorage.setItem('mystra-function-library', JSON.stringify(this.functionLibrary));
        } catch (e) {
            console.error("Failed to save library to storage", e);
        }
    }
}
customElements.define('logos-companion', LogosCompanion);
