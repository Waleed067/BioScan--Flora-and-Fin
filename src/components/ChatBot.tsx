import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Sparkles, Loader2, ImageIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export type ChatBotHandle = {
  open: () => void;
  ask: (prompt: string) => void;
};

export function ChatBot({
  image,
  context,
  openSignal,
  pendingPrompt,
  onPromptConsumed,
}: {
  image?: string | null;
  context?: string | null;
  openSignal?: number;
  pendingPrompt?: string | null;
  onPromptConsumed?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! I'm your **BioScan Assistant** 🌿🐠 — ask me anything about plant care, fish health, diseases, or how to use the scanner." },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastImageRef = useRef<string | null>(null);
  const lastSignalRef = useRef<number | undefined>(undefined);

  // External open signal (from bottom nav, etc.)
  useEffect(() => {
    if (openSignal !== undefined && openSignal !== lastSignalRef.current) {
      lastSignalRef.current = openSignal;
      setOpen(true);
    }
  }, [openSignal]);

  // When a new scan image arrives, surface a friendly notice in chat
  useEffect(() => {
    if (image && image !== lastImageRef.current) {
      lastImageRef.current = image;
      setMessages((p) => [
        ...p,
        { role: "assistant", content: "📎 Your scan image is attached. Ask me anything about it — diagnosis, treatment, care tips, anything." },
      ]);
    }
    if (!image) lastImageRef.current = null;
  }, [image]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  // Build the payload sent to the backend. When an image is attached, we
  // prepend a multimodal user turn carrying the image + scan context so the
  // model can "see" it without the user copy-pasting anything.
  const buildPayload = (next: Msg[]) => {
    const base: any[] = [];
    if (image) {
      const ctx = context?.trim()
        ? `Here is the user's recent scan. Use it as context for the conversation.\n\n${context}`
        : "Here is the user's recent scan image. Use it as visual context for the conversation.";
      base.push({
        role: "user",
        content: [
          { type: "text", text: ctx },
          { type: "image_url", image_url: { url: image } },
        ],
      });
      base.push({ role: "assistant", content: "Got it — I can see the scan. What would you like to know?" });
    }
    // Only pass the user-visible turns (skip the first greeting & any local notices)
    const visible = next.filter((m) => !m.content.startsWith("📎"));
    return [...base, ...visible.slice(1)];
  };

  const send = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    if (!override) setInput("");
    setLoading(true);

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: buildPayload(next) }),
      });

      if (!resp.ok || !resp.body) {
        const errText = resp.status === 429 ? "Rate limit reached. Please wait a moment." : resp.status === 402 ? "AI credits exhausted." : "Something went wrong.";
        setMessages((p) => [...p, { role: "assistant", content: errText }]);
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let acc = "";
      let started = false;
      let done = false;

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              if (!started) {
                started = true;
                setMessages((p) => [...p, { role: "assistant", content: acc }]);
              } else {
                setMessages((p) => p.map((m, i) => (i === p.length - 1 ? { ...m, content: acc } : m)));
              }
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      setMessages((p) => [...p, { role: "assistant", content: "Network error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  // External pending prompt (e.g. from Emergency Symptoms tap)
  useEffect(() => {
    if (pendingPrompt && !loading) {
      setOpen(true);
      send(pendingPrompt);
      onPromptConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPrompt]);

  const attachedBadge = useMemo(() => image ? (
    <div className="flex items-center gap-2 px-2 py-1 rounded-lg glass border-primary/30 text-[11px]">
      <img src={image} alt="attached scan" className="w-6 h-6 rounded object-cover" />
      <span className="text-primary font-medium">Scan attached</span>
    </div>
  ) : null, [image]);

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open assistant"
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-gradient-hero shadow-glow flex items-center justify-center text-primary-foreground hover:scale-105 transition-transform"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {image && !open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary border-2 border-background flex items-center justify-center">
            <ImageIcon className="w-2 h-2 text-primary-foreground" />
          </span>
        )}
      </button>

      <div
        className={cn(
          "fixed bottom-24 right-5 z-50 w-[min(92vw,380px)] h-[min(70vh,560px)] glass rounded-2xl shadow-glow flex flex-col overflow-hidden transition-all origin-bottom-right",
          open ? "scale-100 opacity-100" : "scale-90 opacity-0 pointer-events-none"
        )}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
          <div className="w-8 h-8 rounded-lg bg-gradient-hero flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm">BioScan Assistant</div>
            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Online
            </div>
          </div>
          {attachedBadge}
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                  m.role === "user"
                    ? "bg-gradient-hero text-primary-foreground rounded-br-sm"
                    : "glass rounded-bl-sm"
                )}
              >
                <div className="prose prose-sm prose-invert max-w-none [&>*]:my-1 [&_code]:text-xs">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {loading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="glass rounded-2xl rounded-bl-sm px-3 py-2 text-sm flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" /> Thinking…
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="p-3 border-t border-border/50 flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={image ? "Ask about your scan…" : "Ask about plants or fish…"}
            disabled={loading}
            className="glass border-primary/20"
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()} className="bg-gradient-hero text-primary-foreground shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </>
  );
}
