"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Bot, User, Sparkles, Loader2, BookOpen } from "lucide-react";

interface Recommendation {
  id: string;
  title: string;
  reason: string;
}

export default function AIAssistantPage() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ai/chat" }),
  });
  const isLoading = status === "streaming" || status === "submitted";
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recLoading, setRecLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input });
      setInput("");
    }
  };

  const fetchRecommendations = async () => {
    setRecLoading(true);
    try {
      const res = await fetch("/api/ai/recommend", { method: "POST" });
      const data = await res.json();
      setRecommendations(Array.isArray(data) ? data : []);
    } catch {
      setRecommendations([]);
    } finally {
      setRecLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Library Assistant</h1>
        <p className="text-muted-foreground">
          Chat with our AI to find books, get recommendations, and more
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="flex h-[600px] flex-col">
            <CardHeader className="border-b py-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bot className="h-5 w-5" /> Library Assistant
              </CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Bot className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 font-medium">How can I help you today?</p>
                    <p className="text-sm text-muted-foreground">
                      Ask me to find books, get recommendations, or learn about the library
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {[
                        "What books do you have about science?",
                        "Recommend a good fiction novel",
                        "What are the most popular books?",
                      ].map((suggestion) => (
                        <Button
                          key={suggestion}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            sendMessage({ text: suggestion });
                          }}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}
                  >
                    {message.role === "assistant" && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`rounded-lg px-4 py-2 text-sm max-w-[80%] ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">
                        {message.parts.map((part, i) =>
                          part.type === "text" ? <span key={i}>{part.text}</span> : null
                        )}
                      </p>
                    </div>
                    {message.role === "user" && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}

                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex gap-1 rounded-lg bg-muted px-4 py-3">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="border-t p-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about books, get recommendations..."
                  disabled={isLoading}
                />
                <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-5 w-5" /> AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recommendations.length === 0 && !recLoading ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-3">
                    Get personalized book recommendations based on your reading history
                  </p>
                  <Button onClick={fetchRecommendations} variant="outline" size="sm">
                    <Sparkles className="h-4 w-4 mr-1" /> Get Recommendations
                  </Button>
                </div>
              ) : recLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendations.map((rec) => (
                    <a key={rec.id} href={`/books/${rec.id}`} className="block rounded-lg border p-3 transition-colors hover:bg-accent">
                      <div className="flex items-start gap-2">
                        <BookOpen className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{rec.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{rec.reason}</p>
                        </div>
                      </div>
                    </a>
                  ))}
                  <Button onClick={fetchRecommendations} variant="ghost" size="sm" className="w-full" disabled={recLoading}>
                    {recLoading && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    Refresh
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
