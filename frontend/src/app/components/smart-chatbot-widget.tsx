import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, X, MapPin, Scissors, Star } from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import { barbershops, services, barbers } from "../data/marketplace-data";

interface Message {
  id: number;
  type: "ai" | "user";
  content: string;
  suggestions?: string[];
  barbershopCards?: typeof barbershops;
}

interface SmartChatbotWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  context?: {
    type: "search" | "barbershop-detail" | "general";
    barbershopId?: number;
  };
}

export function SmartChatbotWidget({ isOpen, onClose, context }: SmartChatbotWidgetProps) {
  const navigate = useNavigate();
  const location = useLocation();
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

  // Initialize conversation based on context
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initializeConversation();
    }
  }, [isOpen, context]);

  const initializeConversation = () => {
    setIsTyping(true);
    setTimeout(() => {
      let greeting: Message;

      if (context?.type === "search") {
        greeting = {
          id: 1,
          type: "ai",
          content: "👋 Hi! I'm your AI assistant. I can help you find the perfect barbershop based on your preferences. What are you looking for today?",
          suggestions: [
            "Find barbershops with classic cuts",
            "Show me nearby premium barbershops",
            "I need a quick trim",
            "Best rated barbershops",
          ],
        };
      } else if (context?.type === "barbershop-detail" && context.barbershopId) {
        const barbershop = barbershops.find((b) => b.id === context.barbershopId);
        const shopServices = services.filter((s) => s.barbershopId === context.barbershopId);
        
        greeting = {
          id: 1,
          type: "ai",
          content: `👋 Hi! I can help you learn more about **${barbershop?.name || "this barbershop"}** and book services. What would you like to know?`,
          suggestions: [
            "What services are available?",
            "Show me pricing",
            "Who are the barbers?",
            "Book an appointment",
          ],
        };
      } else {
        greeting = {
          id: 1,
          type: "ai",
          content: "👋 Hi! I'm your AI style consultant. How can I help you today?",
          suggestions: [
            "Find a barbershop",
            "AI face scan for recommendations",
            "Browse services",
            "View my bookings",
          ],
        };
      }

      setMessages([greeting]);
      setIsTyping(false);
    }, 500);
  };

  const handleSend = (messageText?: string) => {
    const text = messageText || input;
    if (!text.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      type: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI processing
    setTimeout(() => {
      const aiResponse = generateAIResponse(text.toLowerCase());
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const generateAIResponse = (userInput: string): Message => {
    const responseId = messages.length + 2;

    // Context-aware responses for search page
    if (context?.type === "search") {
      if (userInput.includes("classic") || userInput.includes("traditional")) {
        const classicShops = barbershops.filter((b) =>
          b.specialties?.some((s) => s.toLowerCase().includes("classic"))
        );
        return {
          id: responseId,
          type: "ai",
          content: `I found ${classicShops.length} barbershops specializing in classic cuts. Here are my top recommendations:`,
          barbershopCards: classicShops.slice(0, 3),
        };
      }

      if (userInput.includes("premium") || userInput.includes("luxury")) {
        const premiumShops = barbershops.filter((b) => b.priceRange === "$$$");
        return {
          id: responseId,
          type: "ai",
          content: `Here are the premium barbershops in your area:`,
          barbershopCards: premiumShops,
        };
      }

      if (userInput.includes("rated") || userInput.includes("best")) {
        const topRated = [...barbershops].sort((a, b) => b.rating - a.rating).slice(0, 3);
        return {
          id: responseId,
          type: "ai",
          content: `These are the highest-rated barbershops based on customer reviews:`,
          barbershopCards: topRated,
        };
      }

      if (userInput.includes("nearby") || userInput.includes("close")) {
        const nearby = barbershops.slice(0, 3);
        return {
          id: responseId,
          type: "ai",
          content: `Here are the barbershops closest to you:`,
          barbershopCards: nearby,
        };
      }

      if (userInput.includes("fade")) {
        const fadeShops = barbershops.filter((b) =>
          b.specialties?.some((s) => s.toLowerCase().includes("fade"))
        );
        return {
          id: responseId,
          type: "ai",
          content: fadeShops.length > 0
            ? `Found ${fadeShops.length} barbershops specializing in fades:`
            : "Let me show you barbershops with fade specialists:",
          barbershopCards: fadeShops.length > 0 ? fadeShops : barbershops.slice(0, 2),
        };
      }
    }

    // Context-aware responses for barbershop detail page
    if (context?.type === "barbershop-detail" && context.barbershopId) {
      const barbershop = barbershops.find((b) => b.id === context.barbershopId);
      const shopServices = services.filter((s) => s.barbershopId === context.barbershopId);
      const shopBarbers = barbers.filter((b) => b.barbershopId === context.barbershopId);

      if (userInput.includes("service") || userInput.includes("price") || userInput.includes("cost")) {
        const serviceList = shopServices.map((s) => `• **${s.name}** - ${s.price} (${s.duration})`).join("\n");
        return {
          id: responseId,
          type: "ai",
          content: `Here are the services available at ${barbershop?.name}:\n\n${serviceList}`,
          suggestions: ["Book an appointment", "Tell me about the barbers", "What are the hours?"],
        };
      }

      if (userInput.includes("barber") || userInput.includes("staff") || userInput.includes("who")) {
        const barberList = shopBarbers.map((b) => `• **${b.name}** - ${b.title} (${b.experience})`).join("\n");
        return {
          id: responseId,
          type: "ai",
          content: `Meet our talented team:\n\n${barberList}\n\nAll our barbers are highly skilled professionals!`,
          suggestions: ["Book with a specific barber", "View services", "Check availability"],
        };
      }

      if (userInput.includes("book") || userInput.includes("appointment") || userInput.includes("schedule")) {
        return {
          id: responseId,
          type: "ai",
          content: `Great! I can help you book an appointment at ${barbershop?.name}. Click the button below to start the booking process.`,
          suggestions: ["Start booking"],
        };
      }

      if (userInput.includes("hours") || userInput.includes("open") || userInput.includes("time")) {
        const hoursList = Object.entries(barbershop?.hours || {})
          .map(([day, time]) => `• **${day}**: ${time}`)
          .join("\n");
        return {
          id: responseId,
          type: "ai",
          content: `${barbershop?.name} is open:\n\n${hoursList}`,
          suggestions: ["Book an appointment", "View services"],
        };
      }
    }

    // General responses
    if (userInput.includes("face scan") || userInput.includes("ai scan")) {
      return {
        id: responseId,
        type: "ai",
        content: "Our AI Visual Consultant can analyze your face shape and recommend personalized hairstyles! Would you like to try it?",
        suggestions: ["Take me to AI scanner", "Tell me more"],
      };
    }

    if (userInput.includes("booking") || userInput.includes("appointments")) {
      return {
        id: responseId,
        type: "ai",
        content: "You can view and manage all your bookings in the My Bookings section. Would you like to go there?",
        suggestions: ["View my bookings", "Find barbershops"],
      };
    }

    // Default response
    return {
      id: responseId,
      type: "ai",
      content: "I can help you find barbershops, book appointments, or get personalized style recommendations. What would you like to do?",
      suggestions: ["Find a barbershop", "AI face scan", "View my bookings"],
    };
  };

  const handleSuggestionClick = (suggestion: string) => {
    const lowerSuggestion = suggestion.toLowerCase();

    // Navigation suggestions
    if (lowerSuggestion.includes("ai scanner") || lowerSuggestion.includes("ai scan")) {
      navigate("/ai-consultant");
      onClose();
      return;
    }

    if (lowerSuggestion.includes("my bookings") || lowerSuggestion.includes("view my bookings")) {
      navigate("/my-bookings");
      onClose();
      return;
    }

    if (lowerSuggestion.includes("start booking") && context?.barbershopId) {
      navigate(`/booking?barbershopId=${context.barbershopId}`);
      onClose();
      return;
    }

    // Otherwise, send as regular message
    handleSend(suggestion);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
        onClick={onClose}
      />

      {/* Chat Widget */}
      <div
        className={`fixed z-50 bg-card border-l border-border shadow-2xl flex flex-col transition-all duration-300 ${
          isOpen
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0 pointer-events-none"
        } ${
          // Mobile: fullscreen slide-up, Desktop: sidebar
          "inset-x-0 bottom-0 top-0 md:inset-y-0 md:right-0 md:left-auto md:w-[420px]"
        }`}
        style={{
          transform: isOpen
            ? "translateX(0) translateY(0)"
            : window.innerWidth < 768
            ? "translateY(100%)"
            : "translateX(100%)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-card-foreground">AI Assistant</h2>
              <p className="text-xs text-muted-foreground font-light">Always here to help</p>
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
                  <p className="font-light leading-relaxed">{message.content}</p>
                )}

                {/* Barbershop Cards */}
                {message.barbershopCards && message.barbershopCards.length > 0 && (
                  <div className="space-y-3 mt-3">
                    {message.barbershopCards.map((shop) => (
                      <button
                        key={shop.id}
                        onClick={() => {
                          navigate(`/barbershop/${shop.id}`);
                          onClose();
                        }}
                        className="w-full bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-all text-left"
                      >
                        <div className="flex gap-3 p-3">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            <img
                              src={shop.coverImage}
                              alt={shop.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-card-foreground mb-1 text-sm">
                              {shop.name}
                            </h4>
                            <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
                              <MapPin className="w-3 h-3" />
                              <span className="font-light truncate">{shop.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-primary text-primary" />
                                <span className="text-xs font-bold text-card-foreground">
                                  {shop.rating}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-primary font-bold">
                                {shop.priceRange}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Suggestion Chips */}
                {message.suggestions && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {message.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-sm font-normal transition-colors border border-primary/20"
                      >
                        {suggestion}
                      </button>
                    ))}
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
        <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask me anything..."
              className="flex-1 px-4 py-3 bg-muted rounded-lg text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2 font-light">
            AI responses are suggestions. Always verify with the barbershop.
          </p>
        </div>
      </div>
    </>
  );
}
