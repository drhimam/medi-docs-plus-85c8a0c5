import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AskAI = () => {
  const { toast } = useToast();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleAsk = async () => {
    if (!question.trim()) {
      toast({
        title: "Error",
        description: "Please enter a question",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = { role: 'user', content: question.trim() };
    setMessages(prev => [...prev, userMessage]);
    setQuestion("");
    setIsAsking(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: articles, error: articlesError } = await supabase
        .from('knowledge_articles')
        .select('title, content, category')
        .eq('user_id', user.id)
        .limit(5);

      if (articlesError) throw articlesError;

      const { data, error } = await supabase.functions.invoke('ask-knowledge-ai', {
        body: { 
          question: question.trim(),
          context: articles || []
        }
      });

      if (error) throw error;

      const assistantMessage: Message = { role: 'assistant', content: data.answer };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error asking AI:', error);
      toast({
        title: "Error",
        description: "Failed to get answer from AI",
        variant: "destructive",
      });
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Ask AI</h1>
        <p className="text-muted-foreground mt-1">Ask medical questions powered by your knowledge base</p>
      </div>

      <Card className="h-[600px] flex flex-col">
        <CardHeader>
          <CardTitle>Ask Medical Knowledge AI</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ask questions about medical topics. The AI will use your knowledge base articles to provide contextual answers (RAG).
          </p>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4">
          <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center space-y-2">
                  <Bot className="h-12 w-12 mx-auto opacity-50" />
                  <p>Ask a medical question to get started</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="flex gap-2">
            <Textarea
              placeholder="Ask a medical question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAsk();
                }
              }}
              rows={2}
              disabled={isAsking}
            />
            <Button
              onClick={handleAsk}
              disabled={isAsking || !question.trim()}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
