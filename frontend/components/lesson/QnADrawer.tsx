"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

interface QnADrawerProps {
  instanceId: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;
  isOffTopic?: boolean;
}

export function QnADrawer({ instanceId }: QnADrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOpen = (e: CustomEvent) => {
      setIsOpen(true);
      if (e.detail?.question) {
        setInput(e.detail.question);
      }
    };
    window.addEventListener('open-qna-drawer', handleOpen as EventListener);
    return () => window.removeEventListener('open-qna-drawer', handleOpen as EventListener);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    
    const userMsg = input.trim();
    setInput("");
    
    // Optimistic UI
    setMessages(prev => [...prev, { id: Date.now().toString(), role: "user", text: userMsg }]);
    setIsTyping(true);

    try {
      const res = await fetch(`http://localhost:8000/api/lesson-instances/${instanceId}/qna`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMsg })
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: "ai", 
        text: data.answer_markdown,
        isOffTopic: data.scope === "off_topic"
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: "ai", 
        text: "Sorry, I lost my connection. Please try asking again!" 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        style={{ position: "fixed", bottom: "32px", right: "32px", zIndex: 9999 }}
        className="w-14 h-14 bg-[#818cf8] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(129,140,248,0.3)] hover:shadow-[0_0_30px_rgba(129,140,248,0.5)] transition-shadow"
      >
        <MessageSquare size={24} className="text-[#0A0A0F]" />
      </motion.button>

      {/* Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}
            className="bg-black/70 flex justify-end"
            onClick={() => setIsOpen(false)}
          >
            {/* Drawer Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-[420px] h-full bg-[#12121A] border-l-2 border-[#3F3F4E] flex flex-col shadow-[-10px_0_40px_rgba(0,0,0,0.8)]"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#242430] bg-[#1a1a24]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#818cf8]/10 flex items-center justify-center border border-[#818cf8]/30">
                    <Bot size={20} className="text-[#818cf8]" />
                  </div>
                  <div>
                    <h2 className="text-white font-semibold text-[16px]">AI Coach</h2>
                    <p className="text-[13px] text-[#A0A0AB]">Ask me anything!</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[#242430] text-[#A0A0AB] hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Chat Area */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-[#0e0e13]">
                {messages.length === 0 && (
                  <div className="text-center text-[#A0A0AB] text-[14px] mt-10">
                    Feel free to ask questions about the lesson, or business English in general!
                  </div>
                )}
                
                {messages.map(msg => (
                  <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${msg.role === "user" ? "bg-[#35343a]" : "bg-[#818cf8]/20 border border-[#818cf8]/30"}`}>
                      {msg.role === "user" ? <User size={14} className="text-[#c6c5d5]" /> : <Bot size={14} className="text-[#818cf8]" />}
                    </div>
                    <div className={`flex flex-col gap-2 max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                      <div className={`p-3 rounded-[14px] text-[15px] leading-relaxed ${
                        msg.role === "user" 
                          ? "bg-[#35343a] text-white rounded-tr-[4px]" 
                          : "bg-[#242430] text-[#e4e1e9] rounded-tl-[4px]"
                      }`}>
                        {msg.role === "user" ? (
                          msg.text
                        ) : (
                          <div className="prose prose-invert prose-sm">
                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                      
                      {msg.isOffTopic && (
                        <button className="bg-[#818cf8]/10 text-[#818cf8] text-[12px] font-medium px-3 py-1.5 rounded-full border border-[#818cf8]/30 hover:bg-[#818cf8]/20 transition-colors" onClick={() => setIsOpen(false)}>
                          Return to Lesson
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#818cf8]/20 border border-[#818cf8]/30 flex items-center justify-center">
                      <Bot size={14} className="text-[#818cf8]" />
                    </div>
                    <div className="p-4 bg-[#242430] rounded-[14px] rounded-tl-[4px] flex items-center gap-1">
                      <motion.div className="w-1.5 h-1.5 bg-[#818cf8] rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                      <motion.div className="w-1.5 h-1.5 bg-[#818cf8] rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
                      <motion.div className="w-1.5 h-1.5 bg-[#818cf8] rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-[#3F3F4E] bg-[#1a1a24]">
                <div style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}>
                  <input 
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSend()}
                    placeholder="Ask a question..."
                    disabled={isTyping}
                    style={{ paddingRight: "48px" }}
                    className="w-full bg-[#0e0e13] border border-[#3F3F4E] rounded-full pl-5 py-3.5 text-[15px] text-white placeholder:text-[#52525B] focus:outline-none focus:border-[#818cf8] disabled:opacity-50 transition-colors"
                  />
                  <button 
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                    style={{ position: "absolute", right: "8px" }}
                    className="w-9 h-9 bg-[#818cf8] rounded-full flex items-center justify-center text-[#0A0A0F] disabled:bg-[#35343a] disabled:text-[#52525B] transition-colors"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
