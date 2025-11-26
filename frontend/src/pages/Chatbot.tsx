import { useState, useEffect } from "react";
import { ChatInterface } from "@/components/chatbot/ChatInterface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Chatbot() {
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    // Generar nuevo sessionId en cada carga
    const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(id);
  }, []);

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="h-[calc(100vh-4rem)] flex flex-col">
          <CardHeader>
            <CardTitle>Asistente Virtual de Citas Médicas</CardTitle>
            <p className="text-sm text-muted-foreground">
              Agende su cita médica de forma rápida y sencilla
            </p>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <ChatInterface sessionId={sessionId} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

