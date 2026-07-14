"use client";
/**
 * @ai-restriction
 * Primary Owner: Talha
 */

import { useState, useRef, useEffect } from "react";
import { Mic, Bot, Volume2 } from "lucide-react";
import { motion, AnimatePresence, animate } from "framer-motion";
import Strands from "@/components/ui/Strands";

interface Message {
  id: string;
  sender: "Coach" | "You";
  text: string;
  audioData?: string;
}

interface ThreadedVoiceProps {
  instanceId: string;
  nodeId: string;
  content?: any;
  onEndSession: () => void;
}

export function ThreadedVoice({ instanceId, nodeId, content, onEndSession }: ThreadedVoiceProps) {
  const [messages, setMessages] = useState<Message[]>(
    content?.opening_line ? [{ id: "0", sender: "Coach", text: content.opening_line }] : []
  );
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const interimTranscriptRef = useRef("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  const [visuals, setVisuals] = useState({
    speed: 0.2,
    amplitude: 0.4,
    waviness: 0.5,
    thickness: 0.3
  });
  const [sessionComplete, setSessionComplete] = useState(false);

  useEffect(() => {
    if (!isPlayingAudio && sessionComplete) {
      handleEndSession();
    }
  }, [isPlayingAudio, sessionComplete]);

  useEffect(() => {
    const controls = animate(visuals, {
      speed: isPlayingAudio ? 1.0 : 0.2,
      amplitude: isPlayingAudio ? 1.5 : 0.4,
      waviness: isPlayingAudio ? 1.2 : 0.5,
      thickness: isPlayingAudio ? 0.8 : 0.3,
    }, {
      duration: 0.8,
      ease: "easeInOut",
      onUpdate: (latest) => setVisuals({ ...latest })
    });
    return controls.stop;
  }, [isPlayingAudio]);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }

    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/voice?session_id=${instanceId}&lesson_id=${nodeId}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.event === "assistant.partial") {
        // Update the last Coach message with the partial text
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg && lastMsg.sender === "Coach" && !lastMsg.audioData) {
            lastMsg.text = data.accumulated_text;
          } else {
            newMessages.push({
              id: Date.now().toString(),
              sender: "Coach",
              text: data.accumulated_text
            });
          }
          return newMessages;
        });
      }

      if (data.event === "assistant.final") {
        setIsProcessing(false);
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg && lastMsg.sender === "Coach") {
            lastMsg.text = data.text;
            lastMsg.audioData = data.reply_audio_b64;
          }
          return newMessages;
        });
        if (data.reply_audio_b64) {
          playAudioData(data.reply_audio_b64);
        } else {
          playTTSFallback(data.text);
        }
      }

      if (data.event === "conversation.complete") {
        setSessionComplete(true);
      }
    };

    ws.onopen = () => {
      ws.send(JSON.stringify({ event: "start_session", lesson_id: nodeId }));
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
    };
  }, [instanceId, nodeId]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
      };

      // Initialize SpeechRecognition for real-time display
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (event: any) => {
          let transcript = "";
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setInterimTranscript(transcript);
          interimTranscriptRef.current = transcript;
        };
        recognition.start();
        recognitionRef.current = recognition;
      }

      // Record in chunks of 500ms for streaming
      mediaRecorder.start(500);
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Microphone access is required for voice practice.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { }
      }
      setIsRecording(false);
      setIsProcessing(true);

      const transcript = interimTranscriptRef.current;
      if (transcript) {
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: "You", text: transcript }]);
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            event: "transcript.final",
            transcript,
            session_id: instanceId,
            lesson_id: nodeId,
          }));
        }
      }

      setInterimTranscript("");
      interimTranscriptRef.current = "";
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const playAudioData = (base64Data: string) => {
    try {
      const audio = new Audio(`data:audio/mpeg;base64,${base64Data}`);
      setIsPlayingAudio(true);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => setIsPlayingAudio(false);
      audio.play();
    } catch (e) {
      console.error("Error playing audio", e);
      setIsPlayingAudio(false);
    }
  };

  const playTTSFallback = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices?.() || [];
      const preferredVoice =
        voices.find((voice) => /female|woman|zira|samantha|victoria|google us english female/i.test(voice.name)) ||
        voices.find((voice) => /female|woman/i.test(voice.name)) ||
        voices.find((voice) => /female|woman/i.test(voice.voiceURI)) ||
        voices.find((voice) => /female|woman/i.test(voice.lang));
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleEndSession = async () => {
    setIsProcessing(true);
    try {
      await fetch(`/api/lesson-instances/${instanceId}/voice/finish`, {
        method: "POST",
      });
      onEndSession();
    } catch (error) {
      console.error("Error ending session:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const visibleMessages = messages.length > 0 ? messages.slice(-3) : [
    { id: "intro", sender: "Coach" as const, text: "Ready to speak? Tap the mic when you're ready to start the roleplay." }
  ];

  const renderMessages = [...visibleMessages];
  if (interimTranscript) {
    renderMessages.push({ id: "interim", sender: "You", text: interimTranscript });
  }
  // If we pushed an interim message and it makes the array too long, shift one out
  if (renderMessages.length > 3) {
    renderMessages.shift();
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col gap-6 w-full"
    >
      {content?.scenario && (
        <div className="flex flex-col gap-2 bg-[#818cf8]/10 border border-[#818cf8]/30 rounded-xl p-4 ml-14 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#818cf8]" />
          <span className="text-[12px] font-bold text-[#818cf8] uppercase tracking-wider">Scenario</span>
          <p className="text-[14px] text-[#e4e1e9] leading-relaxed">{content.scenario}</p>
        </div>
      )}

      <div className="pl-14 w-full flex flex-col items-center gap-8">
        <div className="relative w-[180px] h-[180px] md:w-[220px] md:h-[220px] rounded-full overflow-hidden shrink-0 mt-4">
          <div className="absolute inset-0 w-full h-full">
            <Strands
              style={{}}
              colors={isPlayingAudio ? ["#818CF8", "#0EA5E9"] : ["#6366f1", "#4f46e5"]}
              count={30}
              speed={visuals.speed}
              amplitude={visuals.amplitude}
              waviness={visuals.waviness}
              thickness={visuals.thickness}
              glow={2.5}
              taper={2}
              spread={1.8}
              intensity={0.8}
              saturation={1.5}
              opacity={1}
              scale={1.2}
              glass={false}
            />
          </div>
          <div className={`absolute inset-0 rounded-full border shadow-[0_0_40px_rgba(129,140,248,0.2)] pointer-events-none transition-colors ${isPlayingAudio ? "border-[#818CF8]/30" : "border-[#4f46e5]/10"}`} />
        </div>

        <div className="w-full max-w-[600px] flex flex-col justify-end min-h-[120px]">
          <div className="flex flex-col gap-4">
            <AnimatePresence mode="popLayout">
              {renderMessages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="flex flex-col gap-1 w-full shrink-0"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        msg.sender === "Coach"
                          ? "text-[#818cf8] text-[12px] font-bold tracking-wide uppercase"
                          : "text-[#A0A0AB] text-[12px] font-bold tracking-wide uppercase"
                      }
                    >
                      {msg.sender}
                    </span>
                    {msg.sender === "Coach" && (
                      <button
                        onClick={() => {
                          if (msg.audioData) {
                            playAudioData(msg.audioData);
                          } else {
                            playTTSFallback(msg.text);
                          }
                        }}
                        className="text-[#818cf8] hover:text-[#bdc2ff] transition-colors bg-[#818cf8]/10 hover:bg-[#818cf8]/20 p-1 rounded-full flex items-center justify-center"
                        title="Play audio"
                      >
                        <Volume2 size={14} />
                      </button>
                    )}
                  </div>
                  <p className="text-[#e4e1e9] text-[16px] md:text-[18px] leading-relaxed font-medium">
                    {msg.text}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 mt-4 w-full">
          <button
            onClick={toggleRecording}
            disabled={isProcessing}
            className={`flex items-center gap-3 px-8 h-[56px] rounded-full transition-all group active:scale-95 border-2
              ${isProcessing
                ? "bg-[#35343a] border-[#35343a] text-[#c6c5d5] opacity-70 cursor-not-allowed"
                : isRecording
                  ? "bg-red-500 border-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:bg-red-400 hover:border-red-400"
                  : "bg-[#818cf8] border-[#818cf8] text-[#0A0A0F] shadow-[0_0_20px_rgba(129,140,248,0.2)] hover:bg-[#bdc2ff] hover:border-[#bdc2ff]"
              }
            `}
          >
            <Mic
              size={22}
              className={`transition-transform ${isRecording ? "animate-pulse" : (isProcessing ? "" : "group-hover:scale-110")}`}
              fill="currentColor"
            />
            <span className="text-[15px] font-bold tracking-wide">
              {isProcessing ? "AI Thinking..." : isRecording ? "Tap to Stop" : "Tap to Speak"}
            </span>
          </button>

          <button
            onClick={handleEndSession}
            disabled={isProcessing || isRecording}
            className="text-[#908f9e] hover:text-white transition-colors text-[14px] font-semibold mt-4 disabled:opacity-50"
          >
            End Session & Grade
          </button>
        </div>
      </div>
    </motion.div>
  );
}
