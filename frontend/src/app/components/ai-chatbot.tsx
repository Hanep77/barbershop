import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, X } from "lucide-react";
import { useNavigate } from "react-router";
import type {
  HairstyleRecommendation,
  FaceShape,
} from "../data/marketplace-data";
import { faceShapeDescriptions } from "../data/marketplace-data";

interface Message {
  id: number;
  type: "ai" | "user";
  content: string;
  hairstyleCards?: HairstyleRecommendation[];
  showBarbershopButton?: boolean;
  selectedStyles?: string[];
}

interface AIChatbotProps {
  faceShape: FaceShape;
  recommendations: HairstyleRecommendation[];
  onClose: () => void;
}

export function AIChatbot({
  faceShape,
  recommendations,
  onClose,
}: AIChatbotProps) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let isMounted = true;

    const initializeChat = () => {
      try {
        // Initial greeting message
        const greetingDelay = setTimeout(() => {
          if (isMounted) {
            setMessages([
              {
                id: 1,
                type: "ai",
                content: `Hello! 👋 I've analyzed your facial structure and determined you have a **${faceShape}** face shape.`,
              },
            ]);
          }
        }, 500);

        // Face shape description
        const descriptionDelay = setTimeout(() => {
          if (isMounted) {
            setMessages((prev) => [
              ...prev,
              {
                id: 2,
                type: "ai",
                content: faceShapeDescriptions[faceShape],
              },
            ]);
          }
        }, 1500);

        // Recommendations
        const recommendationsDelay = setTimeout(() => {
          if (isMounted) {
            setMessages((prev) => [
              ...prev,
              {
                id: 3,
                type: "ai",
                content:
                  "Based on your face shape, here are my top hairstyle recommendations perfectly tailored for you:",
                hairstyleCards: recommendations,
              },
            ]);
          }
        }, 2500);

        // Follow-up question
        const followUpDelay = setTimeout(() => {
          if (isMounted) {
            setMessages((prev) => [
              ...prev,
              {
                id: 4,
                type: "ai",
                content:
                  "Which styles catch your eye? I can help you find barbershops that specialize in these cuts! 💈",
                showBarbershopButton: true,
              },
            ]);
          }
        }, 3500);

        return () => {
          clearTimeout(greetingDelay);
          clearTimeout(descriptionDelay);
          clearTimeout(recommendationsDelay);
          clearTimeout(followUpDelay);
        };
      } catch (err) {
        console.error("Error in initializeChat:", err);
      }
    };

    const cleanup = initializeChat();

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, [faceShape, recommendations]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      type: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: messages.length + 2,
        type: "ai",
        content:
          "Great question! All of these styles would look fantastic on you. I'd recommend starting with the style that best matches your lifestyle and maintenance preferences. Would you like me to find barbershops that specialize in any of these cuts?",
        showBarbershopButton: true,
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleFindBarbershops = (selectedTags?: string[]) => {
    // Get tags from recommendations
    const tags =
      selectedTags || recommendations.flatMap((r) => r.tags).slice(0, 3);

    // Navigate to search with specialty filter
    const params = new URLSearchParams();
    params.set("specialty", tags[0] || "Classic");
    params.set("ai_recommended", "true");
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-6">
      <div className="bg-card w-full md:max-w-2xl md:rounded-xl border-t md:border border-border shadow-2xl flex flex-col h-full md:h-[700px]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-card-foreground">
                AI Style Consultant
              </h2>
              <p className="text-xs text-muted-foreground font-light">
                Powered by BarberBrody AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] ${
                  message.type === "user"
                    ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3"
                    : "space-y-3"
                }`}
              >
                {message.type === "ai" && (
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                    <p className="text-card-foreground font-light leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                )}

                {message.type === "user" && (
                  <p className="font-light leading-relaxed">
                    {message.content}
                  </p>
                )}

                {/* Hairstyle Cards */}
                {message.hairstyleCards && (
                  <div className="grid grid-cols-1 gap-3 mt-3">
                    {message.hairstyleCards.map((style) => (
                      <div
                        key={style.id}
                        className="bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-all"
                      >
                        <div className="flex gap-4 p-4">
                          <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            <img
                              src={style.image}
                              alt={style.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-card-foreground mb-1">
                              {style.name}
                            </h4>
                            <p className="text-muted-foreground text-sm font-light mb-2 line-clamp-2">
                              {style.description}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {style.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-normal"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Find Barbershops Button */}
                {message.showBarbershopButton && (
                  <div className="mt-3">
                    <button
                      onClick={() => handleFindBarbershops()}
                      className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Find Barbershops with These Styles
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask me anything about hairstyles..."
              className="flex-1 px-4 py-3 bg-muted rounded-lg text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2 font-light">
            AI recommendations are suggestions. Consult your barber for
            personalized advice.
          </p>
        </div>
      </div>
    </div>
  );
}
