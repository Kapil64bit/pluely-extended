import { useEffect } from "react";
import { Card, Settings, Completion, ChatHistory } from "./components";
import { ChatConversation } from "./types";
import { check } from "@tauri-apps/plugin-updater";
import { listen } from "@tauri-apps/api/event";

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

  // Setup update check and screenshot listener
  useEffect(() => {
    const appUseEffectId = `app_useEffect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[DEBUG-${appUseEffectId}] App useEffect initialized`);

    check();
    let unlisten: (() => void) | undefined;
    listen<string>("pluely://screenshot-captured", (e) => {
      const listenId = `listen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const b64 = e.payload;
      console.log(`[DEBUG-${listenId}] Tauri event 'pluely://screenshot-captured' received`);
      console.log(`[DEBUG-${listenId}] Base64 payload length:`, b64?.length || 'undefined');

      if (b64) {
        console.log(`[DEBUG-${listenId}] Dispatching DOM event 'pluely-screenshot'`);
        window.dispatchEvent(new CustomEvent("pluely-screenshot", { detail: { base64: b64 } }));
        console.log(`[DEBUG-${listenId}] DOM event dispatched successfully`);
      } else {
        console.log(`[DEBUG-${listenId}] No base64 payload, skipping DOM event dispatch`);
      }
    }).then((f) => {
      unlisten = f;
      console.log(`[DEBUG-${appUseEffectId}] Tauri event listener registered`);
    });

    return () => {
      console.log(`[DEBUG-${appUseEffectId}] App useEffect cleanup - removing Tauri listener`);
      if (unlisten) unlisten();
    };
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
