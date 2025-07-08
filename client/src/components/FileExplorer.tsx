import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Folder, 
  File, 
  Plus, 
  Search, 
  Download,
  Code,
  Terminal,
  History,
  FileText,
  FolderOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface FileInfo {
  name: string;
  path: string;
  type: "file" | "directory";
  size: number;
  modified: string;
}

interface FileData {
  id: number;
  name: string;
  path: string;
  type: string;
  content: string | null;
}

export default function FileExplorer() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPath, setCurrentPath] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFileContent, setNewFileContent] = useState("");
  const [newFileType, setNewFileType] = useState<"file" | "directory">("file");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: files = [] } = useQuery<FileInfo[]>({
    queryKey: ['/api/files', { path: currentPath }],
    refetchInterval: 5000,
  });

  const createFile = useMutation({
    mutationFn: async (data: { name: string; path: string; content?: string; type: string }) => {
      const response = await apiRequest("POST", "/api/files", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      setIsCreateDialogOpen(false);
      setNewFileName("");
      setNewFileContent("");
      toast({
        title: "Success",
        description: `${newFileType === 'file' ? 'File' : 'Directory'} created successfully`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: `Failed to create ${newFileType}`,
        variant: "destructive",
      });
    },
  });

  const handleCreateFile = () => {
    if (!newFileName.trim()) return;

    const fullPath = currentPath ? `${currentPath}/${newFileName}` : newFileName;
    
    createFile.mutate({
      name: newFileName,
      path: fullPath,
      content: newFileType === 'file' ? newFileContent : undefined,
      type: newFileType,
    });
  };

  const getFileIcon = (file: FileInfo) => {
    if (file.type === "directory") {
      return <Folder className="text-blue-400" size={14} />;
    }
    
    const ext = file.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
        return <Code className="text-yellow-400" size={14} />;
      case 'py':
        return <Code className="text-green-400" size={14} />;
      case 'json':
        return <FileText className="text-red-400" size={14} />;
      case 'md':
        return <FileText className="text-gray-400" size={14} />;
      default:
        return <File className="text-gray-400" size={14} />;
    }
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size}B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
    return `${(size / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="w-80 terminal-panel border-r terminal-border flex flex-col">
      {/* File Browser Header */}
      <div className="p-3 border-b terminal-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium terminal-text">File Explorer</h3>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="terminal-muted hover:terminal-text p-1">
                <Plus size={14} />
              </Button>
            </DialogTrigger>
            <DialogContent className="terminal-panel border terminal-border">
              <DialogHeader>
                <DialogTitle className="terminal-text">Create New Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Button
                    variant={newFileType === 'file' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewFileType('file')}
                  >
                    File
                  </Button>
                  <Button
                    variant={newFileType === 'directory' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewFileType('directory')}
                  >
                    Directory
                  </Button>
                </div>
                <Input
                  placeholder="Enter name..."
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="terminal-bg border terminal-border terminal-text"
                />
                {newFileType === 'file' && (
                  <Textarea
                    placeholder="Enter file content (optional)..."
                    value={newFileContent}
                    onChange={(e) => setNewFileContent(e.target.value)}
                    className="terminal-bg border terminal-border terminal-text font-mono"
                    rows={6}
                  />
                )}
                <Button onClick={handleCreateFile} className="w-full">
                  Create {newFileType === 'file' ? 'File' : 'Directory'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="relative">
          <Input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="terminal-bg border terminal-border terminal-text placeholder:terminal-muted text-xs"
          />
          <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 terminal-muted" size={12} />
        </div>
      </div>
      
      {/* File Tree */}
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1">
          {filteredFiles.map((file) => (
            <div
              key={file.path}
              className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded cursor-pointer group"
              onClick={() => {
                if (file.type === "directory") {
                  setCurrentPath(file.path);
                }
              }}
            >
              {getFileIcon(file)}
              <div className="flex-1 min-w-0">
                <div className="text-sm terminal-text truncate">{file.name}</div>
                <div className="text-xs terminal-muted">
                  {file.type === "file" ? formatFileSize(file.size) : "Directory"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      <div className="p-3 border-t terminal-border">
        <h4 className="text-xs font-medium terminal-muted mb-2">Quick Actions</h4>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="terminal-bg border terminal-border hover:bg-gray-700 flex flex-col items-center p-2"
          >
            <Download className="text-blue-400 mb-1" size={14} />
            <span className="text-xs terminal-text">Download</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="terminal-bg border terminal-border hover:bg-gray-700 flex flex-col items-center p-2"
          >
            <Code className="text-green-400 mb-1" size={14} />
            <span className="text-xs terminal-text">Create</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="terminal-bg border terminal-border hover:bg-gray-700 flex flex-col items-center p-2"
          >
            <Terminal className="text-yellow-400 mb-1" size={14} />
            <span className="text-xs terminal-text">Execute</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="terminal-bg border terminal-border hover:bg-gray-700 flex flex-col items-center p-2"
          >
            <History className="text-purple-400 mb-1" size={14} />
            <span className="text-xs terminal-text">History</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
