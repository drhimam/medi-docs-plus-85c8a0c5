import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User, History, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

export const AskAI = () => {
  const { toast } = useToast();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setIsLoadingConversations(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('chat_conversations')
        .select('id, title, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      const typedMessages = (data || []).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));
      setMessages(typedMessages);
      setCurrentConversationId(conversationId);
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation",
        variant: "destructive",
      });
    }
  };

  const createNewConversation = async (firstQuestion: string): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const title = firstQuestion.slice(0, 50) + (firstQuestion.length > 50 ? '...' : '');
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({ user_id: user.id, title })
        .select()
        .single();

      if (error) throw error;
      await loadConversations();
      return data.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  const saveMessage = async (conversationId: string, role: 'user' | 'assistant', content: string) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({ conversation_id: conversationId, role, content });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setQuestion("");
  };

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
    const currentQuestion = question.trim();
    setMessages(prev => [...prev, userMessage]);
    setQuestion("");
    setIsAsking(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create or use existing conversation
      let conversationId = currentConversationId;
      if (!conversationId) {
        conversationId = await createNewConversation(currentQuestion);
        if (conversationId) {
          setCurrentConversationId(conversationId);
        }
      }

      // Save user message
      if (conversationId) {
        await saveMessage(conversationId, 'user', currentQuestion);
      }

      const { data: articles, error: articlesError } = await supabase
        .from('knowledge_articles')
        .select('title, content, category')
        .eq('user_id', user.id)
        .limit(5);

      if (articlesError) throw articlesError;

      const { data, error } = await supabase.functions.invoke('ask-knowledge-ai', {
        body: { 
          question: currentQuestion,
          context: articles || []
        }
      });

      if (error) throw error;

      const assistantMessage: Message = { role: 'assistant', content: data.answer };
      setMessages(prev => [...prev, assistantMessage]);

      // Save assistant message
      if (conversationId) {
        await saveMessage(conversationId, 'assistant', data.answer);
      }
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ask AI</h1>
          <p className="text-muted-foreground mt-1">Ask medical questions powered by your knowledge base</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={startNewChat} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2">
                <History className="h-4 w-4" />
                History
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Chat History</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-120px)] mt-4">
                {isLoadingConversations ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : conversations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No conversations yet</p>
                ) : (
                  <div className="space-y-2">
                    {conversations.map((conv) => (
                      <Button
                        key={conv.id}
                        variant={currentConversationId === conv.id ? "secondary" : "ghost"}
                        className="w-full justify-start text-left"
                        onClick={() => loadConversation(conv.id)}
                      >
                        <div className="truncate">
                          <p className="text-sm font-medium truncate">{conv.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(conv.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <Card className="flex flex-col" style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
        <CardHeader>
          <CardTitle>Ask Medical Knowledge AI</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ask questions about medical topics. The AI will use your knowledge base articles to provide contextual answers (RAG).
          </p>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
          <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center space-y-2">
                  <Bot className="h-12 w-12 mx-auto opacity-50" />
                  <p>Ask a medical question to get started</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pb-4">
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
                      {message.role === 'assistant' ? (
                        <div className="prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-headings:my-2">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      )}
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
              className="resize-none"
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
