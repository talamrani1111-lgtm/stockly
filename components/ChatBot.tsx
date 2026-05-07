"use client";
import { useState, useRef, useEffect } from "react";
import { useApp } from "@/lib/context";
import { Send, Bot, User, Loader2, BarChart2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS_HE = [
  "מה זה P/E ratio?",
  "למה VIX חשוב?",
  "מה ההבדל בין QQQ ל-VOO?",
  "מה זה ETF?",
  "איך לקרוא דוח רווחים?",
];

const SUGGESTIONS_EN = [
  "What is a P/E ratio?",
  "Why does VIX matter?",
  "Difference between QQQ and VOO?",
  "What is an ETF?",
  "How to read an earnings report?",
];

export default function ChatBot() {
  const { lang, isRTL, portfolio } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const suggestions = lang === "he" ? SUGGESTIONS_HE : SUGGESTIONS_EN;

  function analyzePortfolio() {
    if (!portfolio.length) return;
    const items = portfolio.map(p => `${p.symbol}: ${p.shares} יחידות, מחיר קנייה $${p.avgPrice}`).join(", ");
    const prompt = lang === "he"
      ? `נתח את תיק ההשקעות שלי: ${items}. ספר לי על פיזור, סיכונים, וציין האם יש ריכוז יתר.`
      : `Analyze my investment portfolio: ${items}. Comment on diversification, risks, and concentration.`;
    sendMessage(prompt);
  }
  const placeholder = lang === "he" ? "שאל על מניות, שוק, מושגים..." : "Ask about stocks, markets, concepts...";
  const title = lang === "he" ? "עוזר השקעות" : "Investment Assistant";
  const subtitle = lang === "he" ? "שאל כל שאלה על שוק ההון" : "Ask anything about the stock market";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    const userMsg = text.trim();
    if (!userMsg || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages([...newMessages, assistantMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages([...newMessages, { role: "assistant", content: accumulated }]);
      }
    } catch {
      setMessages([...newMessages, { role: "assistant", content: lang === "he" ? "שגיאה. נסה שוב." : "Error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[400px]" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-brand-accent/20 flex items-center justify-center">
          <Bot size={20} className="text-brand-accent" />
        </div>
        <div>
          <h2 className="text-white font-semibold text-sm">{title}</h2>
          <p className="text-gray-400 text-xs">{subtitle}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-2">
        {messages.length === 0 && (
          <div className="space-y-3">
            {/* Portfolio analysis button */}
            {portfolio.length > 0 && (
              <button onClick={analyzePortfolio} disabled={loading}
                className="w-full flex items-center gap-2 bg-brand-accent/10 border border-brand-accent/30 hover:border-brand-accent text-brand-accent rounded-2xl px-4 py-3 text-sm font-semibold transition-all">
                <BarChart2 size={16} />
                {lang === "he" ? "נתח את התיק שלי" : "Analyze my portfolio"}
              </button>
            )}
            <p className="text-gray-500 text-xs text-center py-2">
              {lang === "he" ? "💡 שאלות מהירות:" : "💡 Quick questions:"}
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs bg-brand-surface border border-brand-border text-gray-300 rounded-full px-3 py-1.5 hover:border-brand-accent hover:text-brand-accent transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? (isRTL ? "flex-row-reverse" : "flex-row-reverse") : ""}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-brand-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot size={14} className="text-brand-accent" />
              </div>
            )}
            <div
              className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-brand-accent text-black font-medium"
                  : "bg-brand-surface border border-brand-border text-gray-100"
              }`}
            >
              {msg.content}
              {msg.role === "assistant" && loading && i === messages.length - 1 && msg.content === "" && (
                <Loader2 size={14} className="animate-spin text-brand-accent" />
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User size={14} className="text-gray-300" />
              </div>
            )}
          </div>
        ))}

        {loading && messages[messages.length - 1]?.content === "" && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-brand-accent/20 flex items-center justify-center flex-shrink-0">
              <Bot size={14} className="text-brand-accent" />
            </div>
            <div className="bg-brand-surface border border-brand-border rounded-2xl px-3.5 py-2.5">
              <Loader2 size={14} className="animate-spin text-brand-accent" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 items-end mt-3 border-t border-brand-border pt-3">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="flex-1 bg-brand-surface border border-brand-border rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-brand-accent transition-colors"
          style={{ maxHeight: "96px" }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          className="w-10 h-10 rounded-xl bg-brand-accent flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-opacity hover:opacity-90"
        >
          <Send size={16} className="text-black" />
        </button>
      </div>
    </div>
  );
}
