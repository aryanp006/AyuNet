import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, PhoneOff, X, Loader2 } from "lucide-react";
import { api } from "../lib/api";

type SessionState =
  | "idle"
  | "connecting"
  | "greeting"
  | "listening"
  | "processing"
  | "speaking"
  | "ended";

interface Turn {
  role: "assistant" | "patient";
  text: string;
}

interface VoiceRoomProps {
  open: boolean;
  onClose: () => void;
}

export default function VoiceRoom({ open, onClose }: VoiceRoomProps) {
  const [state, setState] = useState<SessionState>("idle");
  const [roomName, setRoomName] = useState("");
  const [transcript, setTranscript] = useState<Turn[]>([]);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const roomNameRef = useRef("");

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [transcript]);

  // Auto-start session when overlay opens
  useEffect(() => {
    if (open && state === "idle") {
      startSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const playAudio = useCallback((audioB64: string): Promise<void> => {
    return new Promise((resolve) => {
      const audio = new Audio(`data:audio/wav;base64,${audioB64}`);
      audioRef.current = audio;
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      audio.play().catch(() => resolve());
    });
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const endSession = useCallback(async () => {
    stopRecording();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const currentRoom = roomNameRef.current;
    if (currentRoom) {
      try {
        await api.livekitEnd(currentRoom);
      } catch (err) {
        console.error("Failed to end session:", err);
      }
    }
    setState("ended");
    setRoomName("");
    roomNameRef.current = "";
  }, [stopRecording]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (audioBlob.size === 0) return;

        setState("processing");

        try {
          const sttResult = await api.stt(audioBlob, "hi");
          const speechText = sttResult.transcript || "";

          if (!speechText.trim()) {
            setState("listening");
            await startRecording();
            return;
          }

          setTranscript((prev) => [
            ...prev,
            { role: "patient", text: speechText },
          ]);

          const currentRoom = roomNameRef.current;
          const response = await api.livekitRespond(currentRoom, speechText);

          if (response.response_text) {
            setTranscript((prev) => [
              ...prev,
              { role: "assistant", text: response.response_text },
            ]);
          }

          if (response.response_audio_b64) {
            setState("speaking");
            await playAudio(response.response_audio_b64);
          }

          if (response.should_continue) {
            setState("listening");
            await startRecording();
          } else {
            await endSession();
          }
        } catch (err: any) {
          console.error("Processing failed:", err);
          setState("listening");
          await startRecording();
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
    } catch (err) {
      console.error("Mic access denied:", err);
      setError("Microphone access denied");
      setState("idle");
    }
  }, [playAudio, endSession]);

  const startSession = useCallback(async () => {
    setState("connecting");
    setError("");
    setTranscript([]);

    try {
      const tokenData = await api.livekitToken("Patient", "hi");
      if (tokenData.error) {
        setError(tokenData.error);
        setState("idle");
        return;
      }

      setRoomName(tokenData.room_name);
      roomNameRef.current = tokenData.room_name;

      setState("greeting");
      const greeting = await api.livekitGreeting(tokenData.room_name);

      if (greeting.text) {
        setTranscript([{ role: "assistant", text: greeting.text }]);
        if (greeting.audio_b64) {
          await playAudio(greeting.audio_b64);
        }
      }

      setState("listening");
      await startRecording();
    } catch (err: any) {
      setError(err.message || "Failed to start session");
      setState("idle");
    }
  }, [playAudio, startRecording]);

  const handleStopTalking = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const handleMuteToggle = useCallback(() => {
    if (streamRef.current) {
      const tracks = streamRef.current.getAudioTracks();
      tracks.forEach((t) => (t.enabled = muted));
      setMuted(!muted);
    }
  }, [muted]);

  const handleClose = useCallback(() => {
    if (state !== "idle" && state !== "ended") {
      endSession();
    }
    setState("idle");
    setTranscript([]);
    setError("");
    onClose();
  }, [state, endSession, onClose]);

  const isActive = state !== "idle" && state !== "ended";
  const isSpeaking = state === "speaking" || state === "greeting";
  const isListening = state === "listening";
  const isProcessing = state === "processing" || state === "connecting";

  const stateLabel: Record<SessionState, string> = {
    idle: "Ready",
    connecting: "Connecting...",
    greeting: "AyuNet is speaking...",
    listening: "Listening to you...",
    processing: "Processing...",
    speaking: "AyuNet is speaking...",
    ended: "Session ended",
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Room container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-[85vw] h-[82vh] max-w-5xl bg-[#07061a] rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-5 right-5 z-20 p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="px-8 pt-6 pb-2 flex items-center gap-3 shrink-0">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Mic className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-white text-sm font-bold tracking-tight">
                  AyuNet Voice Assistant
                </h2>
                <p className="text-white/40 text-[11px] font-medium">
                  AI Healthcare Companion
                </p>
              </div>
            </div>

            {/* Main area — orb + state */}
            <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
              {/* Background glow effects */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[100px]" />
                <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full bg-fuchsia-500/5 blur-[80px]" />
                <div className="absolute bottom-1/3 right-1/3 w-[300px] h-[300px] rounded-full bg-violet-500/5 blur-[80px]" />
              </div>

              {/* Particle Orb */}
              <div className="relative flex items-center justify-center">
                {/* Outer ring 3 */}
                <motion.div
                  className="absolute w-52 h-52 rounded-full border border-indigo-500/10"
                  animate={
                    isSpeaking
                      ? {
                          scale: [1, 1.15, 1.05, 1.2, 1],
                          opacity: [0.3, 0.6, 0.4, 0.7, 0.3],
                        }
                      : isListening
                      ? { scale: [1, 1.05, 1], opacity: [0.2, 0.4, 0.2] }
                      : { scale: 1, opacity: 0.15 }
                  }
                  transition={
                    isSpeaking
                      ? { duration: 0.8, repeat: Infinity, ease: "easeInOut" }
                      : isListening
                      ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                      : { duration: 1 }
                  }
                />

                {/* Outer ring 2 */}
                <motion.div
                  className="absolute w-44 h-44 rounded-full border border-violet-500/15"
                  animate={
                    isSpeaking
                      ? {
                          scale: [1, 1.2, 0.95, 1.15, 1],
                          opacity: [0.4, 0.8, 0.5, 0.7, 0.4],
                        }
                      : isListening
                      ? { scale: [1, 1.08, 1], opacity: [0.3, 0.5, 0.3] }
                      : { scale: 1, opacity: 0.2 }
                  }
                  transition={
                    isSpeaking
                      ? {
                          duration: 0.6,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.1,
                        }
                      : isListening
                      ? {
                          duration: 2.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.3,
                        }
                      : { duration: 1 }
                  }
                />

                {/* Outer ring 1 */}
                <motion.div
                  className="absolute w-36 h-36 rounded-full border border-fuchsia-500/20"
                  animate={
                    isSpeaking
                      ? {
                          scale: [1, 1.1, 1.2, 0.95, 1],
                          opacity: [0.5, 0.9, 0.6, 0.8, 0.5],
                        }
                      : isListening
                      ? { scale: [1, 1.06, 1], opacity: [0.4, 0.6, 0.4] }
                      : { scale: 1, opacity: 0.25 }
                  }
                  transition={
                    isSpeaking
                      ? {
                          duration: 0.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.2,
                        }
                      : isListening
                      ? {
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.5,
                        }
                      : { duration: 1 }
                  }
                />

                {/* Glow layer */}
                <motion.div
                  className="absolute w-28 h-28 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(99,102,241,0.4) 0%, rgba(139,92,246,0.2) 50%, transparent 70%)",
                  }}
                  animate={
                    isSpeaking
                      ? {
                          scale: [1, 1.4, 1.1, 1.5, 1],
                          opacity: [0.6, 1, 0.7, 1, 0.6],
                        }
                      : isListening
                      ? { scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }
                      : isProcessing
                      ? { scale: [1, 1.1, 1], opacity: [0.4, 0.6, 0.4] }
                      : { scale: 1, opacity: 0.3 }
                  }
                  transition={
                    isSpeaking
                      ? { duration: 0.4, repeat: Infinity, ease: "easeInOut" }
                      : isListening
                      ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                      : isProcessing
                      ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                      : { duration: 1 }
                  }
                />

                {/* Core orb */}
                <motion.div
                  className="relative w-24 h-24 rounded-full flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, #6366f1 0%, #8b5cf6 40%, #d946ef 100%)",
                    boxShadow:
                      "0 0 60px rgba(99,102,241,0.3), 0 0 120px rgba(139,92,246,0.15), inset 0 0 30px rgba(255,255,255,0.1)",
                  }}
                  animate={
                    isSpeaking
                      ? {
                          scale: [1, 1.08, 0.96, 1.1, 1],
                          rotate: [0, 2, -2, 1, 0],
                        }
                      : isListening
                      ? { scale: [1, 1.03, 1] }
                      : isProcessing
                      ? { rotate: [0, 360] }
                      : { scale: 1 }
                  }
                  transition={
                    isSpeaking
                      ? { duration: 0.5, repeat: Infinity, ease: "easeInOut" }
                      : isListening
                      ? { duration: 3, repeat: Infinity, ease: "easeInOut" }
                      : isProcessing
                      ? { duration: 2, repeat: Infinity, ease: "linear" }
                      : { duration: 0.5 }
                  }
                >
                  {/* Inner shimmer */}
                  <div className="absolute inset-2 rounded-full bg-gradient-to-t from-white/5 to-white/20" />

                  {/* Center icon */}
                  {isProcessing ? (
                    <Loader2 className="w-8 h-8 text-white/90 animate-spin" />
                  ) : (
                    <motion.div
                      animate={
                        isSpeaking
                          ? { scale: [1, 1.2, 1], opacity: [0.9, 1, 0.9] }
                          : {}
                      }
                      transition={
                        isSpeaking
                          ? {
                              duration: 0.3,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }
                          : {}
                      }
                    >
                      {/* Sound wave bars for speaking */}
                      {isSpeaking ? (
                        <div className="flex items-center gap-[3px] h-8">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <motion.div
                              key={i}
                              className="w-[3px] bg-white/90 rounded-full"
                              animate={{
                                height: ["8px", "20px", "12px", "24px", "8px"],
                              }}
                              transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: i * 0.1,
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        <Mic className="w-8 h-8 text-white/90" />
                      )}
                    </motion.div>
                  )}
                </motion.div>

                {/* Floating particles */}
                {isSpeaking &&
                  Array.from({ length: 8 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1.5 h-1.5 rounded-full bg-indigo-400/60"
                      initial={{ opacity: 0 }}
                      animate={{
                        x: [0, Math.cos((i * Math.PI) / 4) * 100],
                        y: [0, Math.sin((i * Math.PI) / 4) * 100],
                        opacity: [0, 0.8, 0],
                        scale: [0.5, 1.5, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.15,
                        ease: "easeOut",
                      }}
                    />
                  ))}
              </div>

              {/* State label */}
              <motion.p
                className="mt-8 text-white/60 text-sm font-medium tracking-wide"
                key={state}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {stateLabel[state]}
              </motion.p>

              {/* Error */}
              {error && (
                <p className="mt-2 text-red-400 text-xs font-medium">
                  {error}
                </p>
              )}
            </div>

            {/* Transcript area */}
            <div className="px-8 shrink-0">
              <div
                ref={scrollRef}
                className="h-[120px] overflow-y-auto rounded-2xl bg-white/[0.03] border border-white/5 p-4 space-y-2 mb-4"
              >
                {transcript.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-white/20 text-xs">
                      Conversation will appear here...
                    </p>
                  </div>
                ) : (
                  transcript.map((t, i) => (
                    <div
                      key={i}
                      className={`flex ${
                        t.role === "patient" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[75%] px-3 py-2 rounded-2xl text-xs ${
                          t.role === "patient"
                            ? "bg-indigo-600/80 text-white rounded-br-md"
                            : "bg-white/10 text-white/80 rounded-bl-md"
                        }`}
                      >
                        {t.text}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="px-8 pb-6 flex items-center justify-center gap-4 shrink-0">
              {isActive && (
                <>
                  {/* Mute button */}
                  <button
                    onClick={handleMuteToggle}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all border ${
                      muted
                        ? "bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {muted ? (
                      <MicOff className="w-5 h-5" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </button>

                  {/* Stop talking / send button (only when listening) */}
                  {isListening && (
                    <motion.button
                      onClick={handleStopTalking}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-fuchsia-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-shadow"
                    >
                      <div className="w-5 h-5 bg-white rounded-sm" />
                    </motion.button>
                  )}

                  {/* End call */}
                  <button
                    onClick={handleClose}
                    className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white transition-colors shadow-lg shadow-red-500/20"
                  >
                    <PhoneOff className="w-5 h-5" />
                  </button>
                </>
              )}

              {(state === "idle" || state === "ended") && (
                <button
                  onClick={() => {
                    setState("idle");
                    setTranscript([]);
                    startSession();
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white rounded-2xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
                >
                  <Mic className="w-4 h-4" />
                  {state === "ended" ? "Start New Session" : "Start Voice Chat"}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
