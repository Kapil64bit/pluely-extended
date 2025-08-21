import { useEffect } from "react";
import { Card, Settings, Completion, ChatHistory } from "./components";
import { ChatConversation } from "./types";
import { check } from "@tauri-apps/plugin-updater";

const App = () => {
  const handleSelectConversation = (conversation: ChatConversation) => {
    // Use localStorage to communicate the selected conversation to Completion component
    localStorage.setItem("selectedConversation", JSON.stringify(conversation));
    // Trigger a custom event to notify Completion component
    window.dispatchEvent(
      new CustomEvent("conversationSelected", {
        detail: conversation,
      })
    );
  };

  // Check for updates
  useEffect(() => {
    check();
  }, []);

  const handleNewConversation = () => {
    // Clear any selected conversation and trigger new conversation
    localStorage.removeItem("selectedConversation");
    window.dispatchEvent(new CustomEvent("newConversation"));
  };

  return (
    <div className="w-screen h-screen flex overflow-hidden justify-center items-start">
      {/* make the main card a draggable region for frameless Tauri window */}
      <Card className="w-full flex flex-row items-center gap-2 p-2 window-drag">
        <Completion />
        <ChatHistory
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          currentConversationId={null}
        />
        <Settings />
      </Card>
    </div>
  );
};

export default App;
