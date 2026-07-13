Try it: https://drawmeet.vercel.app

Backend: https://drawmeet.onrender.com

Ai Service: https://drawmeet-ai.onrender.com

<video src="./assets/drawmeet_demo.mp4" controls width="100%"></video>


🚀 Excited to share **DrawMeet** — a real-time collaborative whiteboard that I've been building over the past few weeks.

The goal was to build something that combines **real-time collaboration**, **backend architecture**, and **AI** into a single full-stack application while solving real engineering challenges.

### ✨ Key Features

🎨 **Real-time Collaborative Whiteboard**

* Multiple users can draw together on the same board.
* Live cursors, chat, typing indicators, and presence updates using **Socket.IO**.
* Shared canvas synchronized instantly across all connected users.

🖊️ **Rich Canvas Experience**

* Freehand drawing
* Shapes
* Text
* Sticky notes
* Arrows
* Eraser
* Undo / Redo
* Export board as image

🔐 **Authentication & Collaboration**

* JWT-based authentication
* Protected REST APIs
* Board ownership & member management
* Invite members via email
* Join request approval workflow
* Role-based authorization

⚡ **Action-Based Persistence**
Instead of storing the entire canvas, every user interaction is stored as an individual action in MongoDB.

This enables:

* Complete board history
* Replay-based state reconstruction
* Reliable synchronization for newly joined users
* Persistent collaborative sessions

🤖 **AI Integration**
Built a separate **FastAPI AI service** powered by **LangChain + Google Gemini**.

Current AI capabilities:

* Generate editable diagrams from natural language prompts
* AI-powered board summarization based on the current board state

Since diagrams are converted into normal board actions, they can also be:

* Edited
* Undone / Redone
* Synchronized in real time
* Stored in history just like user-created content

### 🛠 Tech Stack

**Frontend**

* Next.js
* React
* TypeScript
* React Konva
* Tailwind CSS
* shadcn/ui

**Backend**

* Node.js
* Express.js
* MongoDB
* Socket.IO
* JWT Authentication

**AI Service**

* FastAPI
* LangChain
* Google Gemini
* Pydantic

### 💡 Some Interesting Engineering Challenges

* Designing scalable Socket.IO room architecture
* Persisting canvas as replayable actions instead of snapshots
* Keeping REST APIs and WebSocket events synchronized
* Converting AI-generated diagrams into editable collaborative actions
* Reconstructing the latest board state while respecting Undo/Redo history
* Building AI as an independent microservice that can evolve separately from the main backend

### 📚 What I Learned

* Designing real-time systems with WebSockets
* Event-driven architecture
* Service-oriented backend design
* Building collaborative applications
* Integrating LLMs into existing products
* Structuring AI outputs using Pydantic
* Bridging AI with traditional backend systems instead of treating it as a standalone feature

This project helped me combine concepts from **frontend development, backend engineering, distributed real-time communication, databases, and applied AI** into one application.

🎥 I've attached a short demo video showing the application in action.

I'd love to hear your feedback or suggestions for future features!

#NextJS #React #NodeJS #SocketIO #MongoDB #FastAPI #LangChain #GoogleGemini #AI #FullStack #WebDevelopment #SoftwareEngineering #OpenToWork



Description: 

DrawMeet is a full-stack real-time collaborative whiteboard built using Next.js, Node.js, Express, Socket.IO, MongoDB, and an integrated Python FastAPI AI service. The application uses JWT-based authentication with protected REST APIs and role-based board permissions to ensure that only authorized users can access or manage collaborative workspaces. The backend follows a service-oriented architecture, separating routing, business logic, and data access to keep the codebase modular and maintainable. Real-time collaboration is powered by Socket.IO rooms, enabling multiple users to simultaneously draw, edit, chat, view live cursors, and see presence and typing indicators within the same board. Rather than storing the entire canvas state, every drawing operation—including shapes, arrows, text, sticky notes, erasing, undo, and redo—is persisted as an individual action in MongoDB, allowing new participants to reconstruct the board by replaying the event history. The platform also supports board ownership, member management, invitation by email, join request approval workflows, and board-specific authorization. On the frontend, React Konva is used for high-performance canvas rendering with an interactive interface that synchronizes real-time updates while maintaining persistent board history across sessions. The platform additionally integrates an AI-powered assistant built with FastAPI, LangChain, Google Gemini, and Pydantic, capable of generating editable diagrams from natural language prompts and producing intelligent summaries of the current board by reconstructing its latest state from the action history. The architecture is designed to be extensible toward production-scale optimizations such as LangGraph agent workflows, event batching, canvas snapshots, and scalable AI-assisted collaboration.
