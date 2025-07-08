import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Terminal from "@/components/Terminal";
import FileExplorer from "@/components/FileExplorer";
import SystemStatus from "@/components/SystemStatus";
import { Bot, Settings, Wifi } from "lucide-react";

export default function Home() {
  const [isConnected, setIsConnected] = useState(true);

  const { data: systemStatus } = useQuery({
    queryKey: ['/api/system-status'],
    refetchInterval: 5000,
  });

  return (
    <div className="h-screen flex flex-col terminal-bg">
      {/* Header */}
      <header className="terminal-panel border-b terminal-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Bot className="text-white" size={16} />
          </div>
          <div>
            <h1 className="text-lg font-semibold terminal-text">AI Shell Commander</h1>
            <p className="text-xs terminal-muted">Gemini-Powered Terminal Assistant</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 text-xs terminal-muted">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
            <Settings className="terminal-muted" size={16} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer Sidebar */}
        <FileExplorer />

        {/* Terminal Area */}
        <Terminal />

        {/* System Status Sidebar */}
        <SystemStatus />
      </div>
    </div>
  );
}
