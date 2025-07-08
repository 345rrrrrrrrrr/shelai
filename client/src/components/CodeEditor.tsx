import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Code, Save, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CodeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent?: string;
  initialLanguage?: string;
  fileName?: string;
}

export default function CodeEditor({ 
  isOpen, 
  onClose, 
  initialContent = "", 
  initialLanguage = "javascript",
  fileName = "untitled"
}: CodeEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [language, setLanguage] = useState(initialLanguage);
  const [currentFileName, setCurrentFileName] = useState(fileName);
  const [aiRequest, setAiRequest] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const languages = [
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "cpp", label: "C++" },
    { value: "c", label: "C" },
    { value: "csharp", label: "C#" },
    { value: "php", label: "PHP" },
    { value: "ruby", label: "Ruby" },
    { value: "go", label: "Go" },
    { value: "rust", label: "Rust" },
    { value: "html", label: "HTML" },
    { value: "css", label: "CSS" },
    { value: "json", label: "JSON" },
    { value: "markdown", label: "Markdown" },
    { value: "sql", label: "SQL" },
    { value: "bash", label: "Bash" },
  ];

  const generateCode = useMutation({
    mutationFn: async (data: { request: string; language: string }) => {
      const response = await apiRequest("POST", "/api/generate-code", data);
      return response.json();
    },
    onSuccess: (data) => {
      setContent(data.code);
      toast({
        title: "Success",
        description: "Code generated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate code",
        variant: "destructive",
      });
    },
  });

  const saveFile = useMutation({
    mutationFn: async (data: { name: string; path: string; content: string; type: string }) => {
      const response = await apiRequest("POST", "/api/files", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      toast({
        title: "Success",
        description: "File saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save file",
        variant: "destructive",
      });
    },
  });

  const handleGenerateCode = () => {
    if (!aiRequest.trim()) return;
    
    generateCode.mutate({
      request: aiRequest,
      language: language,
    });
  };

  const handleSaveFile = () => {
    if (!currentFileName.trim() || !content.trim()) return;
    
    saveFile.mutate({
      name: currentFileName,
      path: currentFileName,
      content: content,
      type: "file",
    });
  };

  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
      setLanguage(initialLanguage);
      setCurrentFileName(fileName);
    }
  }, [isOpen, initialContent, initialLanguage, fileName]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="terminal-panel border terminal-border max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="terminal-text flex items-center">
            <Code className="mr-2" size={16} />
            Code Editor
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
          {/* Editor Controls */}
          <div className="flex space-x-2">
            <Input
              placeholder="File name..."
              value={currentFileName}
              onChange={(e) => setCurrentFileName(e.target.value)}
              className="terminal-bg border terminal-border terminal-text flex-1"
            />
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-40 terminal-bg border terminal-border terminal-text">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="terminal-panel border terminal-border">
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleSaveFile}
              disabled={saveFile.isPending}
              className="flex items-center space-x-1"
            >
              <Save size={14} />
              <span>Save</span>
            </Button>
          </div>

          {/* AI Code Generation */}
          <div className="flex space-x-2">
            <Input
              placeholder="Describe what code you want to generate..."
              value={aiRequest}
              onChange={(e) => setAiRequest(e.target.value)}
              className="terminal-bg border terminal-border terminal-text flex-1"
            />
            <Button
              onClick={handleGenerateCode}
              disabled={generateCode.isPending}
              className="flex items-center space-x-1"
            >
              <Wand2 size={14} />
              <span>Generate</span>
            </Button>
          </div>

          {/* Code Editor */}
          <div className="flex-1 border terminal-border rounded">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your code here..."
              className="terminal-bg border-0 terminal-text font-mono text-sm resize-none h-full"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
