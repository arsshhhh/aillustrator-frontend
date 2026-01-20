import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

function App() {
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const generateNotes = async () => {
    if (!topic) return;

    setNotes("");
    setLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch(
        "https://web-production-2dd1.up.railway.app/generate-stream",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: topic }),
          signal: controller.signal,
        }
      );

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        setNotes((prev) => prev + decoder.decode(value));
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error(err);
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const stopGeneration = () => {
    abortControllerRef.current?.abort();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-3xl">
        <CardContent className="space-y-4 p-6">
          <h1 className="text-2xl font-semibold">
            AI Notes Generator
          </h1>

          <Textarea
            placeholder="Enter a topic..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />

          <div className="flex gap-2">
            <Button onClick={generateNotes} disabled={loading}>
              Generate
            </Button>

            {loading && (
              <Button
                variant="destructive"
                onClick={stopGeneration}
              >
                Stop
              </Button>
            )}
          </div>

          <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg max-h-[400px] overflow-auto">
            {notes}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
