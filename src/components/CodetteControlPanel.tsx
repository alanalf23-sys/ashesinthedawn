/**
 * CodetteControlPanel
 * Advanced control panel for Codette AI with production checklist,
 * settings, perspective switching, and conversation history
 */

import { useState, useEffect } from "react";
import { useDAW } from "../contexts/DAWContext";
import { ChevronDown, ChevronUp, Settings, MessageSquare, CheckCircle, Circle } from "lucide-react";

interface ProductionTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
}

interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  confidence?: number;
}

interface PerspectiveOption {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

export default function CodetteControlPanel() {
  const { codetteConnected, getWebSocketStatus, getCodetteBridgeStatus } = useDAW();
  
  // State management
  const [expandedSection, setExpandedSection] = useState<string | null>("checklist");
  const [productionTasks, setProductionTasks] = useState<ProductionTask[]>([
    {
      id: "1",
      title: "Audio Levels Check",
      description: "Verify all tracks are at optimal levels (-6dB to -3dB peak)",
      completed: false,
      priority: "high",
    },
    {
      id: "2",
      title: "Frequency Balance",
      description: "Check EQ on all tracks, ensure no clipping in any frequency band",
      completed: false,
      priority: "high",
    },
    {
      id: "3",
      title: "Pan and Stereo Width",
      description: "Verify panning decisions and stereo image width",
      completed: false,
      priority: "medium",
    },
    {
      id: "4",
      title: "Dynamics Processing",
      description: "Review compression and gate settings on all tracks",
      completed: false,
      priority: "medium",
    },
    {
      id: "5",
      title: "Effects Quality",
      description: "Ensure reverb, delay, and other effects are not overdone",
      completed: false,
      priority: "medium",
    },
    {
      id: "6",
      title: "Final Loudness Check",
      description: "Verify master track loudness is appropriate for platform",
      completed: false,
      priority: "high",
    },
  ]);

  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm Codette, your AI audio production assistant. I'm ready to help you with analysis, suggestions, and production guidance.",
      timestamp: Date.now() - 60000,
      confidence: 0.95,
    },
  ]);

  const [userInput, setUserInput] = useState("");
  const [perspectives, setPerspectives] = useState<PerspectiveOption[]>([
    { id: "engineer", name: "Audio Engineer", description: "Technical mixing perspective", active: true },
    { id: "producer", name: "Music Producer", description: "Creative production focus", active: false },
    { id: "mastering", name: "Mastering Engineer", description: "Final loudness & clarity", active: false },
  ]);

  const [wsStatus, setWsStatus] = useState({ connected: false, reconnectAttempts: 0 });
  const [bridgeStatus, setBridgeStatus] = useState({ connected: false, reconnectCount: 0, isReconnecting: false });

  // Update status on mount and when connection changes
  useEffect(() => {
    const updateStatus = () => {
      setWsStatus(getWebSocketStatus());
      setBridgeStatus(getCodetteBridgeStatus());
    };

    updateStatus();
    const interval = setInterval(updateStatus, 15000);
    return () => clearInterval(interval);
  }, [codetteConnected, getWebSocketStatus, getCodetteBridgeStatus]);

  const toggleTask = (taskId: string) => {
    setProductionTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const sendMessage = () => {
    if (userInput.trim()) {
      const userMessage: ConversationMessage = {
        id: `msg-${Date.now()}`,
        role: "user",
        content: userInput,
        timestamp: Date.now(),
      };
      setConversationHistory((prev) => [...prev, userMessage]);
      setUserInput("");

      // Simulate assistant response (would be real in Phase 5+)
      setTimeout(() => {
        const assistantMessage: ConversationMessage = {
          id: `msg-${Date.now()}-response`,
          role: "assistant",
          content: `I've analyzed your request about "${userInput}". This would be connected to the real Codette backend for actual responses.`,
          timestamp: Date.now(),
          confidence: 0.85,
        };
        setConversationHistory((prev) => [...prev, assistantMessage]);
      }, 800);
    }
  };

  const togglePerspective = (perspectiveId: string) => {
    setPerspectives((prev) =>
      prev.map((p) =>
        p.id === perspectiveId ? { ...p, active: true } : { ...p, active: false }
      )
    );
  };

  const completedTasks = productionTasks.filter((t) => t.completed).length;
  const totalTasks = productionTasks.length;
  const completionPercentage = Math.round((completedTasks / totalTasks) * 100);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-400";
      case "medium":
        return "text-yellow-400";
      case "low":
        return "text-green-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg w-full h-full overflow-hidden flex flex-col">
      {/* Connection Status */}
      <div className="bg-gray-800 rounded p-3 space-y-2 flex-shrink-0 m-4 mt-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-200">Connection Status</h3>
          <div className="flex gap-2">
            <div className={`w-2 h-2 rounded-full ${codetteConnected ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-xs text-gray-400">{codetteConnected ? "Connected" : "Offline"}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-gray-400">
            REST: {bridgeStatus.connected ? "✓" : "✗"}
          </div>
          <div className="text-gray-400">
            WS: {wsStatus.connected ? "✓" : "✗"}
          </div>
          <div className="text-gray-400">
            Reconnects: {wsStatus.reconnectAttempts}
          </div>
          <div className="text-gray-400">
            Resyncing: {bridgeStatus.isReconnecting ? "Yes" : "No"}
          </div>
        </div>
      </div>

      {/* Production Checklist */}
      <div className="bg-gray-800 rounded overflow-hidden flex-shrink-0 mx-4">
        <button
          onClick={() => setExpandedSection(expandedSection === "checklist" ? null : "checklist")}
          className="w-full flex items-center justify-between p-3 hover:bg-gray-700 transition"
        >
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-blue-400" />
            <span className="text-sm font-semibold text-gray-300">Production Checklist</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{completionPercentage}%</span>
            {expandedSection === "checklist" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {expandedSection === "checklist" && (
          <div className="border-t border-gray-700 p-3 space-y-2 bg-gray-900 max-h-48 overflow-y-auto">
            {/* Progress bar */}
            <div className="w-full bg-gray-800 rounded h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>

            {/* Tasks */}
            <div className="space-y-2">
              {productionTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-2 p-2 hover:bg-gray-800 rounded cursor-pointer transition"
                  onClick={() => toggleTask(task.id)}
                >
                  <button className="flex-shrink-0 mt-1">
                    {task.completed ? (
                      <CheckCircle size={14} className="text-green-500" />
                    ) : (
                      <Circle size={14} className="text-gray-500" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium ${task.completed ? "text-gray-500 line-through" : "text-gray-300"}`}>
                      {task.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                  </div>
                  <span className={`text-xs flex-shrink-0 ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Perspectives */}
      <div className="bg-gray-800 rounded overflow-hidden flex-shrink-0 mx-4">
        <button
          onClick={() => setExpandedSection(expandedSection === "perspectives" ? null : "perspectives")}
          className="w-full flex items-center justify-between p-3 hover:bg-gray-700 transition"
        >
          <div className="flex items-center gap-2">
            <Settings size={16} className="text-purple-400" />
            <span className="text-sm font-semibold text-gray-300">AI Perspectives</span>
          </div>
          {expandedSection === "perspectives" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {expandedSection === "perspectives" && (
          <div className="border-t border-gray-700 p-3 space-y-2 bg-gray-900">
            {perspectives.map((perspective) => (
              <button
                key={perspective.id}
                onClick={() => togglePerspective(perspective.id)}
                className={`w-full text-left p-2 rounded transition ${
                  perspective.active
                    ? "bg-purple-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                <p className="text-xs font-medium">{perspective.name}</p>
                <p className="text-xs opacity-75 mt-1">{perspective.description}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Conversation History */}
      <div className="bg-gray-800 rounded overflow-hidden flex-1 min-h-0 flex flex-col m-4 mt-2">
        <button
          onClick={() => setExpandedSection(expandedSection === "conversation" ? null : "conversation")}
          className="w-full flex items-center justify-between p-3 hover:bg-gray-700 transition flex-shrink-0"
        >
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-green-400" />
            <span className="text-sm font-semibold text-gray-300">Conversation</span>
          </div>
          {expandedSection === "conversation" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {expandedSection === "conversation" && (
          <div className="border-t border-gray-700 bg-gray-900 flex-1 min-h-0 flex flex-col">
            {/* Messages */}
            <div className="flex-1 p-3 space-y-2 overflow-y-auto border-b border-gray-700">
              {conversationHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded text-xs ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    <p>{msg.content}</p>
                    {msg.confidence && (
                      <p className="text-xs opacity-50 mt-1">
                        Confidence: {Math.round(msg.confidence * 100)}%
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-700 flex gap-2 flex-shrink-0">
              <input
                id="codette-user-input"
                name="codette-message"
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask Codette..."
                autoComplete="off"
                className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={sendMessage}
                disabled={!userInput.trim()}
                className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
