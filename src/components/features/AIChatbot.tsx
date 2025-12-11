import { useState } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const presetPrompts = [
  "Check for expired meds",
  "Show top selling drugs",
  "List low stock items",
];

const mockResponses: Record<string, string> = {
  "check for expired meds":
    "Found 3 expired medications:\n• Aspirin 100mg (Batch: ASP-2024-001) - Expired 2 days ago\n• Ibuprofen 400mg (Batch: IBU-2024-015) - Expired 5 days ago\n• Cetirizine 10mg (Batch: CET-2024-008) - Expired 1 day ago\n\nRecommendation: Remove these items from inventory immediately.",
  "show top selling drugs":
    "Top 5 selling drugs this month:\n1. Paracetamol 500mg - 1,250 units\n2. Amoxicillin 500mg - 890 units\n3. Omeprazole 20mg - 756 units\n4. Metformin 500mg - 645 units\n5. Lisinopril 10mg - 589 units",
  "list low stock items":
    "Items below minimum stock level:\n• Amoxicillin 500mg: 45 units (Min: 100)\n• Insulin Glargine: 12 units (Min: 50)\n• Salbutamol Inhaler: 8 units (Min: 25)\n• Metformin 850mg: 38 units (Min: 75)\n\nTotal items requiring reorder: 4",
};

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm your pharmacy assistant. How can I help you today? Try one of the quick actions below or type your question.",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      const normalizedInput = text.toLowerCase().trim();
      let response =
        mockResponses[normalizedInput] ||
        "I understand you're asking about: \"" +
          text +
          "\". Let me help you with that. This feature will be connected to your inventory data for real-time insights.";

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    }, 800);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-105",
          isOpen ? "bg-muted" : "gradient-primary"
        )}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-foreground" />
        ) : (
          <MessageCircle className="h-6 w-6 text-primary-foreground" />
        )}
      </button>

      {/* Chat Window */}
      <div
        className={cn(
          "fixed bottom-24 right-6 z-50 w-[350px] overflow-hidden rounded-2xl border border-border bg-card shadow-xl transition-all duration-300",
          isOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        )}
      >
        {/* Header */}
        <div className="gradient-primary p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/20">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-primary-foreground">
                PharmSync Assistant
              </h3>
              <p className="text-xs text-primary-foreground/80">
                Always here to help
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="h-[300px] overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" && "flex-row-reverse"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  message.role === "assistant"
                    ? "bg-primary/10"
                    : "bg-secondary"
                )}
              >
                {message.role === "assistant" ? (
                  <Bot className="h-4 w-4 text-primary" />
                ) : (
                  <User className="h-4 w-4 text-secondary-foreground" />
                )}
              </div>
              <div
                className={cn(
                  "rounded-2xl px-4 py-2 text-sm",
                  message.role === "assistant"
                    ? "bg-muted text-foreground"
                    : "bg-primary text-primary-foreground"
                )}
              >
                <p className="whitespace-pre-line">{message.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="border-t border-border px-4 py-3">
          <div className="mb-3 flex flex-wrap gap-2">
            {presetPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-primary hover:text-primary-foreground hover:border-primary"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
              className="flex-1"
            />
            <Button size="icon" onClick={() => handleSend(input)}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
