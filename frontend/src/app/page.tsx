"use client";
import TopBar from "../components/TopBar";
import SidebarToolbar from "../components/SidebarToolbar";
import WhiteboardCanvas from "../components/WhiteboardCanvas";
import ChatPanel from "../components/ChatPanel";
import { useState, useEffect, useRef } from "react";
import { socket } from "../lib/socket";

export default function Home() {
  const [activeTool, setTool] = useState("pen");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    { user: "Alice", text: "Welcome to DrawMeet!" },
  ]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const username = useRef("User" + Math.floor(Math.random() * 1000));

  // Undo/redo refs for WhiteboardCanvas
  const whiteboardRef = useRef<any>(null);
  const handleUndo = () => whiteboardRef.current?.handleUndo();
  const handleRedo = () => whiteboardRef.current?.handleRedo();
  const handleExport = () => whiteboardRef.current?.exportAsImage();

  useEffect(() => {
    socket.connect();
    socket.emit("join", { user: username.current });
    socket.on("chat", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    socket.on("typing", (users) => {
      setTypingUsers(users); // show all typing users, including self
    });
    socket.on("presence", (users) => {
      setOnlineUsers(users);
    });
    return () => {
      socket.disconnect();
      socket.off("chat");
      socket.off("typing");
      socket.off("presence");
    };
  }, []);

  const handleSend = () => {
    if (chatInput.trim()) {
      socket.emit("chat", { user: username.current, text: chatInput });
      setChatInput("");
    }
  };

  const handleTyping = (val: string) => {
    socket.emit("typing", { user: username.current, typing: !!val });
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
      <TopBar boardTitle="Demo Board" inviteLink={"https://drawmeet.app/board/123"} onLogout={() => {}} />
      <div className="flex-1 flex flex-row gap-4 p-4 sm:p-8">
        <div className="hidden md:flex flex-col items-center">
          <SidebarToolbar
            activeTool={activeTool}
            setTool={setTool}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onExport={handleExport}
          />
        </div>
        <main className="flex-1 flex flex-col items-center justify-center">
          <WhiteboardCanvas
            ref={whiteboardRef}
            activeTool={activeTool}
            username={username.current}
          />
        </main>
        <div className="hidden lg:flex flex-col">
          <ChatPanel
            messages={messages}
            input={chatInput}
            setInput={setChatInput}
            onSend={handleSend}
            typingUsers={typingUsers}
            onlineUsers={onlineUsers}
            onInputChange={handleTyping}
          />
        </div>
      </div>
      {/* Mobile toolbar/chat switcher can be added here */}
    </div>
  );
}
