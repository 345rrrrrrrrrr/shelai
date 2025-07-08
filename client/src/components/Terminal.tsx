import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Terminal as TerminalIcon, Send, History, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface Command {
  id: number;
  input: string;
  output: string | null;
  isAiCommand: boolean;
  status: string;
  createdAt: string;
}

export default function Terminal() {
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: commands = [] } = useQuery<Command[]>({
    queryKey: ['/api/commands'],
    refetchInterval: 2000,
  });

  const executeCommand = useMutation({
    mutationFn: async (data: { input: string; isAiCommand: boolean }) => {
      const response = await apiRequest("POST", "/api/commands", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/commands'] });
      setInput("");
      setIsProcessing(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to execute command",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);
    
    // Determine if it's an AI command (contains natural language)
    const isAiCommand = !/^[a-zA-Z0-9\s\-\.\/\\]+$/.test(input.trim());
    
    executeCommand.mutate({
      input: input.trim(),
      isAiCommand,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const quickCommands = [
    { label: "ls -la", command: "ls -la" },
    { label: "create new file", command: "create new file", isAi: true },
    { label: "download from URL", command: "download from URL", isAi: true },
    { label: "help", command: "help" },
  ];

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [commands]);

  return (
    <div className="flex-1 flex flex-col">
      {/* Terminal Output */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 font-mono text-sm">
        {/* Welcome Message */}
        <div className="mb-4">
          <div className="terminal-success mb-2 flex items-center">
            <Bot className="mr-2" size={16} />
            AI Shell Commander v1.0.0
          </div>
          <div className="terminal-muted text-xs">
            Powered by Google Gemini API • Type 'help' for available commands
          </div>
        </div>

        {/* Command History */}
        <div className="space-y-3">
          {commands.map((command) => (
            <div key={command.id} className="space-y-2">
              <div className="flex items-start space-x-2">
                <span className="terminal-success">$</span>
                <span className="terminal-text">{command.input}</span>
                {command.isAiCommand && (
                  <Bot className="text-blue-400 ml-2" size={14} />
                )}
              </div>
              
              {command.output && (
                <div className="ml-4 terminal-muted text-xs">
                  {command.isAiCommand ? (
                    <div className="terminal-panel p-3 rounded border terminal-border">
                      <div className="flex items-start space-x-2 mb-2">
                        <Bot className="text-blue-400 mt-1" size={14} />
                        <span className="text-blue-400">AI Assistant:</span>
                      </div>
                      <div className="terminal-text whitespace-pre-wrap">
                        {command.output}
                      </div>
                    </div>
                  ) : (
                    <pre className="whitespace-pre-wrap terminal-panel p-2 rounded border terminal-border">
                      {command.output}
                    </pre>
                  )}
                </div>
              )}
              
              {command.status === 'running' && (
                <div className="ml-4 terminal-warning text-xs">
                  Processing...
                </div>
              )}
              
              {command.status === 'error' && (
                <div className="ml-4 terminal-error text-xs">
                  Command failed
                </div>
              )}
            </div>
          ))}
          
          {isProcessing && (
            <div className="terminal-warning text-xs">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                <span>AI is processing your request...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Command Input */}
      <div className="border-t terminal-border terminal-panel p-4">
        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 terminal-success">
            <TerminalIcon size={14} />
            <span className="font-mono text-sm">$</span>
          </div>
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter command or natural language request..."
              className="terminal-bg border terminal-border terminal-text placeholder:terminal-muted font-mono"
              disabled={isProcessing}
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="terminal-muted hover:terminal-text p-1"
              >
                <History size={14} />
              </Button>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-blue-400 hover:text-blue-300 p-1"
                disabled={isProcessing}
              >
                <Send size={14} />
              </Button>
            </div>
          </div>
        </form>
        
        {/* Command Suggestions */}
        <div className="mt-3 flex flex-wrap gap-2">
          {quickCommands.map((cmd) => (
            <Button
              key={cmd.command}
              variant="outline"
              size="sm"
              className="terminal-bg border terminal-border terminal-muted hover:terminal-text hover:border-blue-500 text-xs"
              onClick={() => setInput(cmd.command)}
            >
              {cmd.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
