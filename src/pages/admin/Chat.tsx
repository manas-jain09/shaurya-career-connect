
import React, { useState, useRef, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Send, Bot, User, RefreshCw, AlertTriangle, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';

interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AdminChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'system',
      content: 'Hello! I\'m your data assistant. I can help you query information about students, jobs, applications, and more. What would you like to know?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null);
  const [showApiKeyError, setShowApiKeyError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Clear any previous error message
    setErrorMessage(null);
    setShowApiKeyError(false);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setLastUserMessage(input);
    setInput('');
    setIsLoading(true);
    
    try {
      // Get only relevant messages for the context (exclude system messages)
      const contextMessages = messages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role, content: m.content }));
      
      const { data, error } = await supabase.functions.invoke('admin-chat', {
        body: { 
          query: input,
          history: contextMessages
        }
      });
      
      if (error) {
        console.error('Error invoking function:', error);
        throw new Error(error.message || 'Failed to get a response');
      }
      
      if (data.error) {
        console.error('API returned error:', data.error);
        
        // Check if it's an API key authentication error
        if (data.error.includes("API key") || data.error.includes("Authentication failed")) {
          setShowApiKeyError(true);
        }
        
        throw new Error(data.error);
      }
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || "I'm sorry, I couldn't process that query. Please try again.",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error querying AI:', error);
      
      // Set a visible error message for the user
      setErrorMessage(
        error instanceof Error 
          ? error.message 
          : 'Failed to get a response. Please try again.'
      );
      
      toast({
        title: 'Error',
        description: 'Failed to get a response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRetry = () => {
    if (lastUserMessage) {
      setInput(lastUserMessage);
    } else {
      // Find the last user message and resend it
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
      if (lastUserMsg) {
        setInput(lastUserMsg.content);
      }
    }
    setErrorMessage(null);
  };

  const closeApiKeyDialog = () => {
    setShowApiKeyError(false);
  };

  return (
    <AdminLayout>
      <Card className="h-[calc(100vh-140px)] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Admin Chat Assistant
          </CardTitle>
          <CardDescription>
            Ask questions about your data to get insights and information
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex-grow overflow-auto mb-4 pr-2">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex items-start gap-2 max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-shaurya-primary text-white'
                      : 'bg-muted'
                  } rounded-lg p-3`}
                >
                  {message.role !== 'user' && (
                    <Bot className="h-5 w-5 mt-1 flex-shrink-0" />
                  )}
                  <div className="space-y-1">
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    <div className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  {message.role === 'user' && (
                    <User className="h-5 w-5 mt-1 flex-shrink-0" />
                  )}
                </div>
              </div>
            ))}
            
            {errorMessage && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-5 w-5" />
                <div className="ml-3">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRetry} 
                  className="ml-auto mt-2 flex items-center"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </Alert>
            )}
            
            {isLoading && (
              <div className="flex justify-center my-4">
                <div className="animate-spin h-8 w-8 border-4 border-current border-t-transparent text-primary rounded-full"></div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
        
        <CardFooter className="border-t pt-4">
          <div className="flex w-full items-center space-x-2">
            <Textarea
              placeholder="Type your question here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="flex-grow"
              rows={3}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="h-full"
            >
              {isLoading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Dialog open={showApiKeyError} onOpenChange={closeApiKeyDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>API Key Configuration Required</DialogTitle>
            <DialogDescription>
              The Gemini API key appears to be invalid or missing. Please add a valid API key to your Supabase edge function secrets.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              To set up your Gemini API key:
            </p>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
              <li>Go to the Supabase dashboard</li>
              <li>Navigate to Project Settings &gt; API</li>
              <li>Under "Edge Function Secrets", add a secret named <code className="bg-muted px-1 py-0.5 rounded">GEMINI_API_KEY</code></li>
              <li>Enter your valid Gemini API key value</li>
              <li>Save your changes</li>
            </ol>
          </div>
          <DialogFooter>
            <Button onClick={closeApiKeyDialog}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminChat;
