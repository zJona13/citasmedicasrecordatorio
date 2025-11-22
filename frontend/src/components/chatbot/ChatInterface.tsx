import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageBubble } from "./MessageBubble";
import { AvailabilitySelector } from "./AvailabilitySelector";
import { chatbotApi } from "@/lib/api";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  options?: Array<{ id: string; texto: string }>;
  availability?: Array<{
    fecha: string;
    dia: string;
    slots: string[];
  }>;
}

interface ChatInterfaceProps {
  sessionId: string;
}

export function ChatInterface({ sessionId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Mensaje inicial del bot
    setMessages([
      {
        id: "1",
        text: "¡Hola! Soy tu asistente virtual para agendar citas médicas. ¿Desea agendar una cita? Puede escribir 'cita' o 'agendar' para comenzar.",
        isBot: true,
        timestamp: new Date(),
      },
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText && !text) return;

    // Agregar mensaje del usuario
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isBot: false,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await chatbotApi.sendMessage({
        sessionId,
        message: messageText,
      });

      // Agregar respuesta del bot
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.mensaje,
        isBot: true,
        timestamp: new Date(),
        options: response.opciones,
        availability: response.availability,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Lo siento, hubo un error al procesar su mensaje. Por favor, intente nuevamente.",
        isBot: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleOptionClick = (option: { id: string; texto: string }) => {
    sendMessage(option.texto);
  };

  const handleAvailabilitySelect = (fecha: string, hora: string) => {
    // Enviar mensaje en formato "YYYY-MM-DD HH:MM" que el backend espera
    const message = `${fecha} ${hora}`;
    sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={message.isBot ? "flex flex-col" : "flex flex-col items-end"}>
            <MessageBubble
              message={message.text}
              isBot={message.isBot}
              timestamp={message.timestamp}
            />
            {message.options && message.options.length > 0 && (
              <div className={`mt-2 flex flex-wrap gap-2 ${message.isBot ? "" : "justify-end"}`}>
                {message.options.map((option) => (
                  <Button
                    key={option.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleOptionClick(option)}
                  >
                    {option.texto}
                  </Button>
                ))}
              </div>
            )}
            {message.availability && message.availability.length > 0 && (
              <div className="mt-2">
                <AvailabilitySelector
                  availability={message.availability}
                  onSelect={handleAvailabilitySelect}
                />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
            <div className="rounded-lg px-4 py-2 bg-muted">
              <p className="text-sm">Escribiendo...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escriba su mensaje..."
            disabled={isLoading}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={isLoading || !input.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

