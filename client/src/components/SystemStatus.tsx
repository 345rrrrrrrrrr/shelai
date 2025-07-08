import { useQuery } from "@tanstack/react-query";
import { Bot, Terminal, Shield, Folder, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SystemStatus {
  aiModelStatus: string;
  shellAccess: string;
  safetyMode: boolean;
  workingDirectory: string;
}

interface Command {
  id: number;
  input: string;
  isAiCommand: boolean;
  createdAt: string;
}

export default function SystemStatus() {
  const { data: systemStatus } = useQuery<SystemStatus>({
    queryKey: ['/api/system-status'],
    refetchInterval: 5000,
  });

  const { data: commands = [] } = useQuery<Command[]>({
    queryKey: ['/api/commands'],
    refetchInterval: 5000,
  });

  const recentCommands = commands.slice(0, 10);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
        return 'terminal-success';
      case 'warning':
        return 'terminal-warning';
      case 'error':
        return 'terminal-error';
      default:
        return 'terminal-muted';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="w-80 terminal-panel border-l terminal-border flex flex-col">
      {/* System Status */}
      <div className="p-3 border-b terminal-border">
        <h3 className="text-sm font-medium terminal-text mb-3">System Status</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs terminal-muted">AI Model</span>
            <span className={`text-xs ${getStatusColor(systemStatus?.aiModelStatus || 'unknown')}`}>
              {systemStatus?.aiModelStatus || 'Unknown'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs terminal-muted">Shell Access</span>
            <span className={`text-xs ${getStatusColor(systemStatus?.shellAccess || 'unknown')}`}>
              {systemStatus?.shellAccess || 'Unknown'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs terminal-muted">Safety Mode</span>
            <span className={`text-xs ${systemStatus?.safetyMode ? 'terminal-warning' : 'terminal-error'}`}>
              {systemStatus?.safetyMode ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs terminal-muted">Working Dir</span>
            <span className="text-xs terminal-text font-mono truncate max-w-32">
              {systemStatus?.workingDirectory || '/unknown'}
            </span>
          </div>
        </div>
      </div>

      {/* Command History */}
      <ScrollArea className="flex-1 p-3">
        <h4 className="text-xs font-medium terminal-muted mb-2">Recent Commands</h4>
        <div className="space-y-1">
          {recentCommands.map((command) => (
            <div
              key={command.id}
              className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded cursor-pointer"
            >
              {command.isAiCommand ? (
                <Bot className="text-blue-400" size={12} />
              ) : (
                <Terminal className="terminal-success" size={12} />
              )}
              <span className="text-xs terminal-text font-mono flex-1 truncate">
                {command.input}
              </span>
              <span className="text-xs terminal-muted">
                {formatTimeAgo(command.createdAt)}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* AI Capabilities */}
      <div className="p-3 border-t terminal-border">
        <h4 className="text-xs font-medium terminal-muted mb-2">AI Capabilities</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="terminal-bg border terminal-border rounded p-2">
            <Terminal className="terminal-success mb-1" size={12} />
            <div className="text-xs terminal-text">Shell Commands</div>
          </div>
          <div className="terminal-bg border terminal-border rounded p-2">
            <Bot className="terminal-warning mb-1" size={12} />
            <div className="text-xs terminal-text">Code Generation</div>
          </div>
          <div className="terminal-bg border terminal-border rounded p-2">
            <Shield className="text-green-400 mb-1" size={12} />
            <div className="text-xs terminal-text">File Downloads</div>
          </div>
          <div className="terminal-bg border terminal-border rounded p-2">
            <Folder className="text-blue-400 mb-1" size={12} />
            <div className="text-xs terminal-text">File Management</div>
          </div>
        </div>
      </div>
    </div>
  );
}
