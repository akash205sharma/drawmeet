import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useRef, useEffect } from "react";

function getAvatarColor(name: string) {
  // Simple pastel color hash
  const colors = ["bg-pink-200", "bg-blue-200", "bg-green-200", "bg-yellow-200", "bg-purple-200", "bg-orange-200"]; 
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

interface ChatUser {
  id: string;
  username: string;
  email: string;
}

interface ChatMessage {
  boardId?: string;
  text: string;
  createdAt?: string;
  user: ChatUser;
}

export default function ChatPanel({
  messages,
  input,
  setInput,
  onSend,
  typingUsers,
  onlineUsers,
  onInputChange,
  currentUserId,
}: {
  messages: ChatMessage[];
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  typingUsers: string[];
  onlineUsers: Array<string | ChatUser>;
  onInputChange: (v: string) => void;
  currentUserId: string;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onlineLabels = onlineUsers.map((user) => (typeof user === "string" ? user : user.username));

  return (
    <Card className="flex flex-col h-full w-full max-w-xs sm:max-w-full sm:w-80 rounded-xl shadow-md bg-white/80 dark:bg-neutral-900/80">
      <div className="flex items-center gap-2 p-3 border-b border-muted text-sm font-medium">
        Online: {onlineLabels.join(", ")}
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {messages.map((msg, i) => {
          const isSelf = msg.user.id === currentUserId;
          return (
            <div
              key={i}
              className={`flex items-end gap-2 ${isSelf ? "justify-end" : "justify-start"}`}
            >
              {!isSelf && (
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${getAvatarColor(msg.user.username)}`}>{msg.user.username[0]}</div>
              )}
              <div
                className={`px-3 py-1 rounded-lg text-sm max-w-[70%] ${isSelf ? "bg-blue-100 dark:bg-blue-900 text-right" : "bg-neutral-200 dark:bg-neutral-800 text-left"}`}
              >
                <span className="font-semibold mr-1">{msg.user.username}:</span>
                <span>{msg.text}</span>
              </div>
              {isSelf && (
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${getAvatarColor(msg.user.username)}`}>{msg.user.username[0]}</div>
              )}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <div className="min-h-6 px-3 text-xs text-muted-foreground transition-opacity duration-300" style={{ opacity: typingUsers.length ? 1 : 0 }}>
        {typingUsers.length > 0 && `${typingUsers.join(", ")} typing...`}
      </div>
      <form
        className="flex gap-2 p-3 border-t border-muted"
        onSubmit={e => {
          e.preventDefault();
          onSend();
        }}
      >
        <Input
          value={input}
          onChange={e => {
            setInput(e.target.value);
            onInputChange(e.target.value);
          }}
          placeholder="Type a message..."
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={!input.trim()}>
          Send
        </Button>
      </form>
    </Card>
  );
}
