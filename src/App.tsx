import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function App() {
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // 🔥 Scrolling refs
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const userScrolledUpRef = useRef(false);

  // ✅ Auto-scroll effect (ChatGPT-style)
  useEffect(() => {
    if (!userScrolledUpRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [notes]);

  // ✅ Detect user intent (NO threshold hacks)
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const atBottom =
      el.scrollTop + el.clientHeight >= el.scrollHeight - 5;

    if (!atBottom) {
      userScrolledUpRef.current = true;
    } else {
      userScrolledUpRef.current = false;
    }
  };

  const generateNotes = async () => {
    if (!topic.trim()) return;

    setNotes("");
    setHasStarted(true);
    setLoading(true);
    userScrolledUpRef.current = false;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch(
        "http://127.0.0.1:8000/generate-stream",
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
      <Card className="w-full max-w-3xl shadow-lg">
        <CardContent className="space-y-6 p-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            AI Notes Generator
          </h1>

          <Textarea
            placeholder="Enter a topic..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="min-h-[80px]"
          />

          <div className="flex gap-2">
            <Button onClick={generateNotes} disabled={loading}>
              Generate
            </Button>

            {loading && (
              <Button variant="destructive" onClick={stopGeneration}>
                Stop
              </Button>
            )}
          </div>

          {/* ✅ Response card only appears when streaming starts */}
          {hasStarted && (
            <Card className="mt-4">
              <CardContent
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="prose dark:prose-invert max-w-none max-h-[60vh] overflow-y-auto"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {notes + (loading ? "▍" : "")}
                </ReactMarkdown>

                {/* Scroll anchor */}
                <div ref={bottomRef} />
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
