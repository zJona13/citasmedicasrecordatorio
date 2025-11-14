import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface AvailabilitySelectorProps {
  availability: {
    fecha: string;
    dia: string;
    slots: string[];
  }[];
  onSelect: (fecha: string, hora: string) => void;
}

export function AvailabilitySelector({
  availability,
  onSelect,
}: AvailabilitySelectorProps) {
  const formatDate = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-PE", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  return (
    <div className="space-y-4">
      {availability.map(({ fecha, dia, slots }) => (
        <Card key={fecha}>
          <CardContent className="p-4">
            <h4 className="font-semibold mb-2 capitalize">{formatDate(fecha)}</h4>
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => (
                <Button
                  key={slot}
                  variant="outline"
                  size="sm"
                  onClick={() => onSelect(fecha, slot)}
                >
                  {slot}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

