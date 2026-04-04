import { useState } from "react";
import { MessageCircle, X } from "lucide-react";

interface FloatingChatButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export function FloatingChatButton({ onClick, isOpen }: FloatingChatButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Tooltip */}
      {showTooltip && !isOpen && (
        <div className="absolute bottom-full right-0 mb-3 px-4 py-2 bg-card border border-border rounded-lg shadow-lg whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 duration-200">
          <p className="text-sm font-bold text-card-foreground">Ask AI Consultant</p>
          <p className="text-xs text-muted-foreground font-light">Get instant help</p>
          {/* Arrow */}
          <div className="absolute top-full right-6 -mt-px">
            <div className="border-8 border-transparent border-t-card" />
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="group relative w-16 h-16 bg-primary rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
        style={{
          boxShadow: "0 4px 20px rgba(200, 150, 62, 0.4), 0 0 40px rgba(200, 150, 62, 0.2)",
        }}
        aria-label="Open AI Consultant Chat"
      >
        {/* Pulse Animation Ring */}
        <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
        
        {/* Icon */}
        <div className="relative">
          {isOpen ? (
            <X className="w-7 h-7 text-primary-foreground transition-transform duration-300 group-hover:rotate-90" />
          ) : (
            <MessageCircle className="w-7 h-7 text-primary-foreground transition-transform duration-300 group-hover:scale-110" />
          )}
        </div>

        {/* Badge Indicator */}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
            AI
          </span>
        )}
      </button>
    </div>
  );
}
