import { useQuery } from "@tanstack/react-query";
import { Bot, Terminal, Clock, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Command {
  id: number;
  input: string;
  output: string | null;
  isAiCommand: boolean;
  status: string;
  createdAt: string;
}

export default function CommandHistory() {
  const { data: commands = [] } = useQuery<Command[]>({
    queryKey: ['/api/commands'],
    refetchInterval: 2000,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-600';
      case 'running':
        return 'bg-yellow-600';
      case 'error':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b terminal-border">
        <h3 className="text-sm font-medium terminal-text flex items-center">
          <Clock className="mr-2" size={16} />
          Command History
        </h3>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {commands.map((command) => (
            <div
              key={command.id}
              className="terminal-panel border terminal-border rounded p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {command.isAiCommand ? (
                    <Bot className="text-blue-400" size={14} />
                  ) : (
                    <Terminal className="terminal-success" size={14} />
                  )}
                  <span className="text-sm terminal-text font-mono">
                    {command.input}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className={getStatusColor(command.status)}>
                    {command.status}
                  </Badge>
                  <span className="text-xs terminal-muted">
                    {formatTime(command.createdAt)}
                  </span>
                </div>
              </div>

              {command.output && (
                <div className="mt-2 p-2 terminal-bg rounded border terminal-border">
                  <pre className="text-xs terminal-muted whitespace-pre-wrap">
                    {command.output}
                  </pre>
                </div>
              )}

              {command.status === 'error' && (
                <div className="flex items-center space-x-2 text-red-400">
                  <AlertCircle size={12} />
                  <span className="text-xs">Command failed</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
