import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: string;
  isBot: boolean;
  timestamp?: Date;
}

export function MessageBubble({ message, isBot, timestamp }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex gap-3 max-w-[80%]"
      )}
    >
      {isBot && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <Bot className="h-4 w-4 text-primary-foreground" />
        </div>
      )}
      <div
        className={cn(
          "rounded-lg px-4 py-2",
          isBot
            ? "bg-muted text-foreground"
            : "bg-primary text-primary-foreground"
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message}</p>
        {timestamp && (
          <p className="text-xs opacity-70 mt-1">
            {timestamp.toLocaleTimeString("es-PE", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
      {!isBot && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <User className="h-4 w-4 text-primary-foreground" />
        </div>
      )}
    </div>
  );
}

