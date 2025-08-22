import { useState } from "react";
import { MessageSquareText, ChevronUp, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button,
  ScrollArea,
} from "@/components";
import { ChatMessage } from "@/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MessageHistoryProps {
  conversationHistory: ChatMessage[];
  currentConversationId: string | null;
  onStartNewConversation: () => void;
}

export const MessageHistory = ({
  conversationHistory,
  currentConversationId,
  onStartNewConversation,
}: MessageHistoryProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Don't show the button if there's no conversation history
  if (!currentConversationId || conversationHistory.length === 0) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          aria-label="View Current Conversation"
          className="relative cursor-pointer"
        >
          <MessageSquareText className="h-5 w-5" />
          <div className="absolute -top-0 -right-0 bg-primary-foreground text-primary rounded-full h-4 w-4 flex border border-primary items-center justify-center text-[10px] font-medium">
            {conversationHistory.length}
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="bottom"
        className="select-none w-96 p-0 border overflow-hidden border-input/50 bg-popover/20 backdrop-blur-sm"
        sideOffset={8}
      >
        <div className="border-b border-input/50 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Current Conversation
            </h2>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => {
                  onStartNewConversation();
                  setIsOpen(false);
                }}
                className="text-xs"
              >
                New Chat
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="text-xs"
              >
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {conversationHistory.length} messages in this conversation
          </p>
        </div>

        <ScrollArea className="h-[calc(100vh-10rem)] max-h-80">
          <div className="p-4 space-y-4">
            {conversationHistory.map((message) => (
              <div
                key={message.id}
                className={`p-3 rounded-lg break-words whitespace-pre-wrap [&_*]:break-words [&_*]:whitespace-pre-wrap ${
                  message.role === "user"
                    ? "bg-primary/10 backdrop-blur-sm border-l-4 border-primary"
                    : "bg-muted/30 backdrop-blur-sm"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase">
                    {message.role === "user" ? "You" : "AI"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
