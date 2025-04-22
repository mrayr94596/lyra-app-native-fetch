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
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
  }, []);

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email: prompt("Enter your email for magic link:"),
    });
    if (error) alert("Error signing in:", error.message);
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
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (err) {
      console.error("🎧 TTS error:", err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "demo-user"
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "Something went wrong.";
      const assistantMessage = { role: "assistant", content: reply };
      setMessages([...newMessages, assistantMessage]);
      await playVoice(reply);
    } catch (error) {
      console.error("💬 Chat error:", error);
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Sorry, something went wrong." }
      ]);
    } finally {
      setIsLoading(false);
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
            <img src="/lyra-avatar.png" alt="Lyra" />
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
              placeholder="Talk to Lyra..."
            />
            <button onClick={sendMessage} disabled={isLoading}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
