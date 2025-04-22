import React, { useState, useEffect } from "react";
import "./App.css";
import { supabase } from "./lib/supabaseClient";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async () => {
    const email = prompt("Enter your email for a magic link:");
    if (!email) return;
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) alert("Sign-in error:", error.message);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const playVoice = async (text) => {
    try {
      const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "tts-1-hd",
          voice: "nova",
          input: text,
          response_format: "mp3"
        }),
      });

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      new Audio(audioUrl).play();
    } catch (err) {
      console.error("🎧 TTS failed:", err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "demo-user"
        },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "Something went wrong.";
      const assistantMessage = { role: "assistant", content: reply };
      setMessages([...updatedMessages, assistantMessage]);
      await playVoice(reply);
    } catch (error) {
      console.error("💬 Chat failed:", error);
      setMessages([
        ...updatedMessages,
        { role: "assistant", content: "Sorry, something went wrong." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="App">
      {!user ? (
        <div className="login">
          <h2>Welcome to Lyra</h2>
          <button onClick={signIn}>Sign in with Magic Link</button>
        </div>
      ) : (
        <div className="chat-window">
          <div className="avatar">
            <img src="/lyra-avatar.png" alt="Lyra, your AI companion" />
            <h1>Lyra</h1>
            <button onClick={signOut}>Sign Out</button>
          </div>

          <div className="messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                {msg.content}
              </div>
            ))}
            {isLoading && <div className="message assistant">Typing...</div>}
          </div>

          <div className="input-area">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Talk to Lyra..."
            />
            <button onClick={sendMessage} disabled={isLoading}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
