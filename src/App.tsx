import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Loader2, Sparkles } from "lucide-react"

function App() {
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const generateNotes = async () => {
    if (!topic.trim()) return;

    setNotes("");
    setLoading(true);

    const res = await fetch("https://web-production-2dd1.up.railway.app/generate-stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: topic }),
    });

    if (!res.body) {
      setLoading(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      setNotes((prev) => prev + chunk);
    }

    setLoading(false);
  };

   return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-3xl shadow-lg rounded-2xl">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Notes Generator
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Generate structured academic notes instantly using AI.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter a topic (e.g. Photosynthesis, DBMS Normalization...)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="resize-none"
          />

          <Button
            onClick={generateNotes}
            disabled={loading || !topic.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating notes...
              </>
            ) : (
              "Generate Notes"
            )}
          </Button>

          {notes && (
            <>
              <Separator />

              <ScrollArea className="h-[400px] rounded-md border p-4">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                  {notes}
                </pre>
              </ScrollArea>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

export default App;
