import React, { useState } from "react";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages }),
    });

    const data = await response.json();
    if (data.choices) {
      setMessages([...newMessages, data.choices[0].message]);
    } else {
      setMessages([...newMessages, { role: "assistant", content: "Something went wrong." }]);
    }
  };

  return (
    <div className="App">
      <div className="chat-window">
        <div className="avatar">
          <img src="/lyra-avatar.png" alt="Lyra" />
          <h1>Lyra</h1>
        </div>
        <div className="messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              {msg.content}
            </div>
          ))}
        </div>
        <div className="input-area">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Talk to Lyra..."
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default App;