import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  ArrowUpRight,
  Check,
  ChevronUp,
  Crown,
  CreditCard,
  FileText,
  Loader2,
  LogOut,
  Paperclip,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  API_BASE_URL,
  apiRequest,
} from "../api/client";


const Research = () => {
  const navigate = useNavigate();

  // =====================================================
  // STATE
  // =====================================================

  const [chats, setChats] = useState([]);
  const [user, setUser] = useState(null);
  const [usage, setUsage] = useState(null);

  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sources, setSources] = useState([]);

  const [question, setQuestion] = useState("");

  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [researching, setResearching] = useState(false);

  const [error, setError] = useState("");

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);

  const [pipeline, setPipeline] = useState({
    search: "pending",
    reader: "pending",
    rag: "pending",
    writer: "pending",
    critic: "pending",
    revisions: 0,
    final_score: 0,
  });

  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [savingChatId, setSavingChatId] = useState(null);
  const [deletingChatId, setDeletingChatId] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const fileInputRef = useRef(null);


  // =====================================================
  // LOAD INITIAL DATA
  // =====================================================

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const paymentParams = new URLSearchParams(
          window.location.search
        );
        const paymentStatus = paymentParams.get("payment");
        const checkoutSessionId = paymentParams.get(
          "session_id"
        );

        if (paymentStatus === "success" && checkoutSessionId) {
          await apiRequest(
            "/api/stripe/sync-checkout-session",
            {
              method: "POST",
              body: JSON.stringify({
                session_id: checkoutSessionId,
              }),
            }
          );
        }

        const [chatData, userData, usageData] = await Promise.all([
          apiRequest("/api/chats/"),
          apiRequest("/api/users/me"),
          apiRequest("/api/users/usage"),
        ]);

        setChats(chatData);
        setUser(userData);
        setUsage(usageData);

        if (paymentStatus) {
          window.history.replaceState(
            {},
            document.title,
            "/research"
          );
        }
      } catch (err) {
        console.error(
          "Failed to load initial data:",
          err
        );

        setError(
          err.message ||
            "Failed to load your Meridian data."
        );
      } finally {
        setLoadingChats(false);
      }
    };

    loadInitialData();
  }, []);


  const handleManageSubscription = async () => {
    if (portalLoading) {
      return;
    }

    try {
      setError("");
      setPortalLoading(true);

      const portal = await apiRequest(
        "/api/stripe/customer-portal",
        {
          method: "POST",
          body: JSON.stringify({
            return_url: window.location.href,
          }),
        }
      );

      if (!portal?.portal_url) {
        throw new Error("Stripe did not return a portal URL.");
      }

      window.open(portal.portal_url, "_self");
    } catch (err) {
      setError(
        err.message ||
          "Could not open subscription management."
      );
    } finally {
      setPortalLoading(false);
    }
  };


  // =====================================================
  // RESET RESEARCH
  // =====================================================

  const handleNewResearch = () => {
    setCurrentChatId(null);
    setMessages([]);
    setSources([]);
    setUploadedDocuments([]);
    setQuestion("");
    setError("");

    setPipeline({
      search: "pending",
      reader: "pending",
      rag: "pending",
      writer: "pending",
      critic: "pending",
      revisions: 0,
      final_score: 0,
    });

    setMobileSidebarOpen(false);
  };


  // =====================================================
  // LOAD EXISTING CHAT
  // =====================================================

  const handleSelectChat = async (chatId) => {
    if (researching) return;

    setError("");
    setLoadingChat(true);
    setMobileSidebarOpen(false);

    try {
      const [messageData, sourceData] = await Promise.all([
        apiRequest(
          `/api/chats/${chatId}/messages`
        ),
        apiRequest(
          `/api/chats/${chatId}/sources`
        ),
      ]);

      setCurrentChatId(chatId);
      setMessages(messageData);
      setSources(sourceData);
      setUploadedDocuments([]);

      setPipeline({
        search: "completed",
        reader: "completed",
        rag: "completed",
        writer: "completed",
        critic: "completed",
        revisions: 0,
        final_score: 0,
      });

    } catch (err) {
      console.error(
        "Failed to load chat:",
        err
      );

      setError(
        err.message ||
          "Failed to load this research."
      );
    } finally {
      setLoadingChat(false);
    }
  };


  const startEditingChat = (chat) => {
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
    setError("");
  };

  const cancelEditingChat = () => {
    setEditingChatId(null);
    setEditingTitle("");
  };

  const handleRenameChat = async (chatId) => {
    const trimmedTitle = editingTitle.trim();

    if (!trimmedTitle) {
      setError("Chat title cannot be empty.");
      return;
    }

    if (trimmedTitle.length > 200) {
      setError("Chat title cannot exceed 200 characters.");
      return;
    }

    try {
      setError("");
      setSavingChatId(chatId);

      const updatedChat = await apiRequest(
        `/api/chats/${chatId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title: trimmedTitle,
          }),
        }
      );

      setChats((previousChats) =>
        previousChats.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                title: updatedChat.title,
                updated_at: updatedChat.updated_at,
              }
            : chat
        )
      );

      setEditingChatId(null);
      setEditingTitle("");
    } catch (err) {
      console.error("Failed to rename chat:", err);
      setError(
        err.message ||
          "Failed to rename the research chat."
      );
    } finally {
      setSavingChatId(null);
    }
  };


  const handleDeleteChat = async (chatId) => {
    const chat = chats.find((item) => item.id === chatId);

    if (!chat) return;

    const confirmed = window.confirm(
      `Delete "${chat.title}"?\n\nThis will permanently delete the research, messages, and sources.`
    );

    if (!confirmed) return;

    try {
      setError("");
      setDeletingChatId(chatId);

      await apiRequest(
        `/api/chats/${chatId}`,
        {
          method: "DELETE",
        }
      );

      setChats((previousChats) =>
        previousChats.filter((item) => item.id !== chatId)
      );

      if (currentChatId === chatId) {
        handleNewResearch();
      }
    } catch (err) {
      console.error("Failed to delete chat:", err);
      setError(
        err.message ||
          "Failed to delete the research chat."
      );
    } finally {
      setDeletingChatId(null);
    }
  };


  // =====================================================
  // DOCUMENT UPLOAD
  // =====================================================

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];

    // Allow selecting the same file again later.
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!currentChatId) {
      setError("Start a research chat before uploading a PDF.");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("PDF must be 10 MB or smaller.");
      return;
    }

    try {
      setError("");
      setUploadingFile(true);

      const token = localStorage.getItem("meridian_token");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${API_BASE_URL}/api/research/documents?chat_id=${encodeURIComponent(currentChatId)}`,
        {
          method: "POST",
          headers: {
            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },
          body: formData,
        }
      );

      if (!response.ok) {
        let message = "PDF upload failed. Please try again.";

        try {
          const errorData = await response.json();
          message = errorData.detail || message;
        } catch {
          // Ignore non-JSON error responses.
        }

        throw new Error(message);
      }

      const document = await response.json();

      setUploadedDocuments((previous) => [
        ...previous.filter((item) => item.id !== document.id),
        document,
      ]);
    } catch (err) {
      console.error("PDF upload failed:", err);

      setError(
        err.message ||
          "PDF upload failed. Please try again."
      );
    } finally {
      setUploadingFile(false);
    }
  };

  const handlePaperclipClick = () => {
    if (researching || uploadingFile) {
      return;
    }

    if (!currentChatId) {
      setError("Start a research chat before uploading a PDF.");
      return;
    }

    fileInputRef.current?.click();
  };


  // =====================================================
  // RESEARCH
  // =====================================================

  const handleResearch = async (event) => {
    event?.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || researching) {
      return;
    }

    setError("");
    setResearching(true);

    setMessages([
      {
        id: `temporary-user-${Date.now()}`,
        role: "user",
        content: trimmedQuestion,
      },
    ]);

    setSources([]);

    setPipeline({
      search: "running",
      reader: "pending",
      rag: "pending",
      writer: "pending",
      critic: "pending",
      revisions: 0,
      final_score: 0,
    });

    try {
      const token = localStorage.getItem("meridian_token");

      const response = await fetch(
        `${API_BASE_URL}/api/research/stream`,
        {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),
        },
        body: JSON.stringify({
          question: trimmedQuestion,
          ...(currentChatId
            ? { chat_id: currentChatId }
            : {}),
        }),
      });

      if (!response.ok) {
        let message = "Research failed. Please try again.";

        try {
          const errorData = await response.json();
          message = errorData.detail || message;
        } catch {
          // Ignore non-JSON error responses.
        }

        throw new Error(message);
      }

      if (!response.body) {
        throw new Error("Streaming is not supported by this browser.");
      }

      setQuestion("");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let result = null;

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, {
          stream: true,
        });

        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const eventBlock of events) {
          const dataLine = eventBlock
            .split("\n")
            .find((line) => line.startsWith("data: "));

          if (!dataLine) {
            continue;
          }

          const event = JSON.parse(
            dataLine.slice(6)
          );

          if (event.type === "stage") {
            setPipeline((previous) => ({
              ...previous,
              [event.stage]: event.status,
            }));
          }

          if (event.type === "result") {
            result = event.data;
          }

          if (event.type === "error") {
            throw new Error(
              event.message ||
                "Research failed. Please try again."
            );
          }
        }
      }

      if (!result) {
        throw new Error(
          "Research stream ended without a final result."
        );
      }

      setCurrentChatId(result.chat_id);

      setMessages([
        {
          id: result.user_message_id,
          role: "user",
          content: result.question,
          created_at: result.created_at,
        },
        {
          id: result.assistant_message_id,
          role: "assistant",
          content: result.answer,
          created_at: result.created_at,
        },
      ]);

      setSources(result.sources || []);

      setPipeline({
        search:
          result.pipeline?.search ||
          "completed",
        reader:
          result.pipeline?.reader ||
          "completed",
        rag:
          result.pipeline?.rag ||
          "completed",
        writer:
          result.pipeline?.writer ||
          "completed",
        critic:
          result.pipeline?.critic ||
          "completed",
        revisions:
          result.pipeline?.revisions ||
          result.revision_count ||
          0,
        final_score:
          result.pipeline?.final_score ||
          result.critic_score ||
          0,
      });

      const updatedChats =
        await apiRequest(
          "/api/chats/"
        );

      setChats(updatedChats);

        setUsage(
          await apiRequest("/api/users/usage")
        );

    } catch (err) {
      console.error(
        "Research failed:",
        err
      );

      setError(
        err.message ||
          "Research failed. Please try again."
      );

      setMessages([
        {
          id: `error-user-${Date.now()}`,
          role: "user",
          content: trimmedQuestion,
        },
      ]);

      setPipeline((previous) => {
        const failedStage = Object.keys(previous).find(
          (key) => previous[key] === "running"
        );

        return {
          ...previous,
          ...(failedStage
            ? { [failedStage]: "failed" }
            : { search: "failed" }),
        };
      });

    } finally {
      setResearching(false);
    }
  };


  // =====================================================
  // STRIPE CHECKOUT
  // =====================================================

  const handleUpgrade = async (planName) => {
    if (planName !== "Premium" || stripeLoading) {
      return;
    }

    try {
      setError("");
      setStripeLoading(true);

      const checkout = await apiRequest(
        "/api/stripe/create-checkout-session",
        {
          method: "POST",
          body: JSON.stringify({
            success_url: `${window.location.origin}/research?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${window.location.origin}/research?payment=cancelled`,
          }),
        }
      );

      if (!checkout?.checkout_url) {
        throw new Error(
          "Stripe did not return a checkout URL."
        );
      }

      window.open(checkout.checkout_url, "_self");
    } catch (err) {
      console.error(
        "Stripe Checkout failed:",
        err
      );

      setError(
        err.message ||
          "Could not start Stripe Checkout. Please try again."
      );
    } finally {
      setStripeLoading(false);
    }
  };


  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem(
      "meridian_token"
    );

    navigate(
      "/login",
      {
        replace: true,
      }
    );
  };


  // =====================================================
  // PIPELINE STAGE
  // =====================================================

  const pipelineStage = (
    label,
    status
  ) => {
    const completed =
      status === "completed";

    const running =
      status === "running";

    const failed =
      status === "failed";

    return (
      <div
        className="
          flex items-center gap-3
          rounded-lg border border-white/5
          bg-white/[0.02]
          px-3 py-2
        "
      >
        <div
          className={`
            flex h-7 w-7 shrink-0 items-center
            justify-center rounded-full
            ${
              completed
                ? "bg-emerald-500/10 text-emerald-400"
                : running
                  ? "bg-blue-500/10 text-blue-400"
                  : failed
                    ? "bg-red-500/10 text-red-400"
                    : "bg-white/5 text-slate-600"
            }
          `}
        >
          {completed ? (
            <Check size={14} />
          ) : running ? (
            <Loader2
              size={14}
              className="animate-spin"
            />
          ) : failed ? (
            <X size={14} />
          ) : (
            <div className="h-1.5 w-1.5 rounded-full bg-current" />
          )}
        </div>

        <span
          className={`
            text-xs
            ${
              completed
                ? "text-slate-300"
                : running
                  ? "text-blue-300"
                  : failed
                    ? "text-red-300"
                    : "text-slate-600"
            }
          `}
        >
          {label}
        </span>
      </div>
    );
  };


  // =====================================================
  // ACCOUNT INITIAL
  // =====================================================

  const accountInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : "U";


  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen bg-[#050711] text-white">


      {/* =================================================
          MOBILE OVERLAY
      ================================================= */}

      {mobileSidebarOpen && (
        <div
          onClick={() =>
            setMobileSidebarOpen(false)
          }
          className="
            fixed inset-0 z-40
            bg-black/60
            backdrop-blur-sm
            xl:hidden
          "
        />
      )}


      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex w-[280px] flex-col
          border-r border-white/10
          bg-[#080b15]
          transition-transform duration-300
          xl:translate-x-0

          ${
            mobileSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >

        {/* BRAND */}

        <div
          className="
            flex h-16 shrink-0
            items-center justify-between
            border-b border-white/10
            px-5
          "
        >
          <div className="flex items-center gap-3">

            <div
              className="
                flex h-9 w-9
                items-center justify-center
                rounded-xl
                bg-gradient-to-br
                from-violet-500
                via-blue-500
                to-cyan-400
                shadow-lg shadow-violet-500/20
              "
            >
              <Sparkles
                size={18}
                className="text-white"
              />
            </div>

            <span
              className="
                text-lg font-semibold
                tracking-tight
              "
            >
              Meridian
            </span>

          </div>

          <button
            onClick={() =>
              setMobileSidebarOpen(false)
            }
            className="
              rounded-lg p-2
              text-slate-500
              hover:bg-white/5
              hover:text-white
              xl:hidden
            "
          >
            <X size={18} />
          </button>

        </div>


        {/* NEW RESEARCH */}

        <div className="p-3">

          <button
            onClick={handleNewResearch}
            className="
              flex w-full items-center
              gap-3 rounded-xl
              border border-white/10
              bg-white/[0.04]
              px-4 py-3
              text-sm font-medium
              text-slate-200
              transition
              hover:border-violet-500/30
              hover:bg-violet-500/[0.06]
              hover:text-white
            "
          >
            <Plus size={17} />

            <span>
              New research
            </span>

          </button>

        </div>


        {/* HISTORY */}

        <div className="flex-1 overflow-y-auto px-3 pb-3">

          <div
            className="
              mb-2 px-3 pt-2
              text-[11px]
              font-medium
              uppercase
              tracking-wider
              text-slate-600
            "
          >
            Research history
          </div>


          {loadingChats ? (
            <div
              className="
                flex items-center
                gap-2 px-3 py-3
                text-xs text-slate-600
              "
            >
              <Loader2
                size={14}
                className="animate-spin"
              />

              Loading history...
            </div>
          ) : chats.length === 0 ? (
            <div
              className="
                px-3 py-4
                text-xs leading-5
                text-slate-600
              "
            >
              Your research conversations
              will appear here.
            </div>
          ) : (
            <div className="space-y-1">

              {chats.map((chat) => {
                const isEditing = editingChatId === chat.id;
                const isSaving = savingChatId === chat.id;
                const isDeleting = deletingChatId === chat.id;

                return (
                  <div
                    key={chat.id}
                    className={`
                      group
                      flex items-center
                      gap-1 rounded-lg
                      transition
                      ${
                        currentChatId === chat.id
                          ? "bg-white/[0.07]"
                          : "hover:bg-white/[0.04]"
                      }
                    `}
                  >
                    {isEditing ? (
                      <>
                        <input
                          autoFocus
                          value={editingTitle}
                          onChange={(event) =>
                            setEditingTitle(event.target.value)
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              handleRenameChat(chat.id);
                            }

                            if (event.key === "Escape") {
                              cancelEditingChat();
                            }
                          }}
                          maxLength={200}
                          className="
                            min-w-0 flex-1
                            rounded-lg
                            border border-violet-500/30
                            bg-white/[0.06]
                            px-3 py-2
                            text-sm text-white
                            outline-none
                            placeholder:text-slate-600
                            focus:border-violet-500/50
                          "
                        />

                        <button
                          type="button"
                          onClick={() =>
                            handleRenameChat(chat.id)
                          }
                          disabled={isSaving}
                          className="
                            shrink-0
                            rounded-lg p-2
                            text-emerald-400
                            transition
                            hover:bg-emerald-500/10
                            disabled:opacity-50
                          "
                          title="Save"
                        >
                          {isSaving ? (
                            <Loader2
                              size={15}
                              className="animate-spin"
                            />
                          ) : (
                            <Check size={15} />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={cancelEditingChat}
                          disabled={isSaving}
                          className="
                            shrink-0
                            rounded-lg p-2
                            text-slate-500
                            transition
                            hover:bg-white/5
                            hover:text-white
                            disabled:opacity-50
                          "
                          title="Cancel"
                        >
                          <X size={15} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectChat(chat.id)
                          }
                          disabled={loadingChat}
                          className="
                            flex min-w-0 flex-1
                            items-center gap-3
                            px-3 py-3
                            text-left
                          "
                        >
                          <Search
                            size={15}
                            className="
                              shrink-0
                              text-slate-600
                            "
                          />

                          <span
                            className={`
                              min-w-0 flex-1
                              truncate text-sm
                              ${
                                currentChatId === chat.id
                                  ? "text-white"
                                  : "text-slate-400"
                              }
                            `}
                          >
                            {chat.title}
                          </span>
                        </button>

                        <div
                          className="
                            mr-1 flex shrink-0 items-center
                            opacity-0 transition
                            group-hover:opacity-100
                          "
                        >
                          <button
                            type="button"
                            onClick={() =>
                              startEditingChat(chat)
                            }
                            disabled={
                              loadingChat ||
                              researching ||
                              isDeleting
                            }
                            className="
                              rounded-lg p-2
                              text-slate-600
                              transition
                              hover:bg-white/5
                              hover:text-slate-300
                              disabled:cursor-not-allowed
                              disabled:opacity-30
                            "
                            title="Rename chat"
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteChat(chat.id)
                            }
                            disabled={
                              loadingChat ||
                              researching ||
                              isDeleting
                            }
                            className="
                              rounded-lg p-2
                              text-slate-600
                              transition
                              hover:bg-red-500/10
                              hover:text-red-400
                              disabled:cursor-not-allowed
                              disabled:opacity-30
                            "
                            title="Delete chat"
                          >
                            {isDeleting ? (
                              <Loader2
                                size={14}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

            </div>
          )}

        </div>


        {/* ACCOUNT */}

        <div
          className="
            relative
            border-t border-white/10
            p-3
          "
        >

          <div
            className="
              mb-3 rounded-xl
              border border-white/10
              bg-white/[0.035]
              px-3 py-3
            "
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <CreditCard
                  size={15}
                  className="shrink-0 text-violet-300"
                />
                <span className="truncate text-xs font-medium text-slate-200">
                  {usage?.plan === "premium" ? "Premium" : "Free"}
                </span>
              </div>
              <span className="shrink-0 text-[10px] text-slate-500">
                {usage
                  ? `${Math.round((usage.used_tokens / usage.token_limit) * 100)}%`
                  : "..."}
              </span>
            </div>

            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="text-xs text-slate-400">
                {usage
                  ? `${usage.used_tokens.toLocaleString()} / ${usage.token_limit.toLocaleString()}`
                  : "Loading usage..."}
              </span>
              <span className="text-[10px] text-slate-600">tokens</span>
            </div>

            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]"
              aria-label="Monthly token usage"
            >
              <div
                className="h-full rounded-full bg-violet-400 transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    usage
                      ? (usage.used_tokens / usage.token_limit) * 100
                      : 0
                  )}%`,
                }}
              />
            </div>

            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-600">
                Resets {usage?.resets_at
                  ? new Date(usage.resets_at).toLocaleDateString(
                      undefined,
                      { month: "short", day: "numeric" }
                    )
                  : "..."}
              </span>

              {usage?.plan === "premium" && (
                <button
                  type="button"
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="
                    inline-flex items-center gap-1
                    text-[10px] font-medium text-violet-300
                    transition hover:text-violet-200
                    disabled:opacity-50
                  "
                >
                  {portalLoading ? "Opening..." : "Manage"}
                  {!portalLoading && <ArrowUpRight size={11} />}
                </button>
              )}
            </div>
          </div>

          {accountOpen && (
            <div
              className="
                absolute bottom-[72px]
                left-3 right-3 z-50
                overflow-hidden
                rounded-xl
                border border-white/10
                bg-[#0d111e]
                shadow-2xl
                shadow-black/40
              "
            >

              <div
                className="
                  border-b border-white/10
                  px-4 py-3
                "
              >
                <p
                  className="
                    truncate text-sm
                    font-medium text-white
                  "
                >
                  {user?.email ||
                    "Loading..."}
                </p>
              </div>


              <button
                onClick={() => {
                  setPricingOpen(true);
                  setAccountOpen(false);
                }}
                className="
                  flex w-full items-center
                  gap-3 px-4 py-3
                  text-sm text-slate-300
                  transition
                  hover:bg-white/5
                  hover:text-white
                "
              >
                <Crown
                  size={17}
                  className="text-slate-400"
                />

                <span>
                  Pricing
                </span>

              </button>


              <button
                onClick={handleLogout}
                className="
                  flex w-full items-center
                  gap-3 px-4 py-3
                  text-sm text-slate-300
                  transition
                  hover:bg-white/5
                  hover:text-red-400
                "
              >
                <LogOut size={17} />

                <span>
                  Logout
                </span>

              </button>

            </div>
          )}


          <button
            onClick={() =>
              setAccountOpen(
                (previous) => !previous
              )
            }
            className="
              flex w-full items-center
              gap-3 rounded-xl
              px-3 py-3
              text-left
              transition
              hover:bg-white/5
            "
          >

            <div
              className="
                flex h-9 w-9 shrink-0
                items-center justify-center
                rounded-full
                bg-white/[0.08]
                text-xs font-semibold
                text-slate-300
              "
            >
              {accountInitial}
            </div>


            <div
              className="
                min-w-0 flex-1
              "
            >
              <p
                className="
                  truncate text-sm
                  font-medium
                  text-slate-200
                "
              >
                {user?.name ||
                  "Loading..."}
              </p>

              <p
                className="
                  text-xs
                  text-slate-500
                "
              >
                {user?.plan === "premium"
                  ? "Premium"
                  : "Free"}
              </p>
            </div>


            <ChevronUp
              size={16}
              className={`
                shrink-0
                text-slate-500
                transition-transform
                duration-200
                ${
                  accountOpen
                    ? "rotate-180"
                    : ""
                }
              `}
            />

          </button>

        </div>

      </aside>


      {/* =================================================
          MAIN AREA
      ================================================= */}

      <main
        className="
          min-h-screen
          xl:ml-[280px]
        "
      >

        {/* HEADER */}

        

        {/* CONTENT */}

        <div
          className="
            flex min-h-[calc(100vh-4rem)]
          "
        >

          {/* CHAT COLUMN */}

          <section
            className="
              flex min-w-0
              flex-1 flex-col
            "
          >

            {/* MESSAGE AREA */}

            <div
              className="
                flex-1 overflow-y-auto
                px-4 py-8
                sm:px-6
                lg:px-10
              "
            >

              <div
                className="
                  mx-auto
                  max-w-4xl
                "
              >

                {/* EMPTY STATE */}

                {messages.length === 0 &&
                  !loadingChat && (
                    <div
                      className="
                        flex min-h-[calc(100vh-15rem)]
                        flex-col
                        items-center
                        justify-center
                        text-center
                      "
                    >

                      <div
                        className="
                          mb-6
                          flex h-16 w-16
                          items-center justify-center
                          rounded-2xl
                          border border-violet-500/20
                          bg-gradient-to-br
                          from-violet-500/10
                          via-blue-500/10
                          to-cyan-500/10
                        "
                      >
                        <Sparkles
                          size={28}
                          className="text-violet-300"
                        />
                      </div>


                      <h1
                        className="
                          text-2xl
                          font-semibold
                          tracking-tight
                          text-white
                          sm:text-3xl
                        "
                      >
                        What would you like
                        to research?
                      </h1>


                      <p
                        className="
                          mt-3 max-w-lg
                          text-sm leading-6
                          text-slate-500
                        "
                      >
                        Ask Meridian a question
                        and its research pipeline
                        will search, read, retrieve,
                        write and critique the answer.
                      </p>

                    </div>
                  )}


                {/* LOADING CHAT */}

                {loadingChat && (
                  <div
                    className="
                      flex items-center
                      justify-center
                      py-24
                    "
                  >
                    <div
                      className="
                        flex items-center
                        gap-3 text-sm
                        text-slate-500
                      "
                    >
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />

                      Loading research...
                    </div>
                  </div>
                )}


                {/* MESSAGES */}

                {!loadingChat &&
                  messages.length > 0 && (
                    <div className="space-y-8">

                      {messages.map(
                        (message) => (
                          <div
                            key={message.id}
                            className={
                              message.role ===
                              "user"
                                ? "flex justify-end"
                                : "flex justify-start"
                            }
                          >

                            {message.role ===
                            "user" ? (
                              <div
                                className="
                                  max-w-[85%]
                                  rounded-2xl
                                  rounded-br-md
                                  bg-white/[0.08]
                                  px-4 py-3
                                  text-sm leading-6
                                  text-slate-200
                                "
                              >
                                {message.content}
                              </div>
                            ) : (
                              <div
                                className="
                                  w-full
                                  rounded-2xl
                                  border border-white/10
                                  bg-white/[0.025]
                                  p-5
                                  sm:p-6
                                "
                              >

                                <div
                                  className="
                                    mb-4 flex
                                    items-center gap-2
                                  "
                                >
                                  <div
                                    className="
                                      flex h-7 w-7
                                      items-center
                                      justify-center
                                      rounded-lg
                                      bg-gradient-to-br
                                      from-violet-500/20
                                      to-blue-500/20
                                    "
                                  >
                                    <Sparkles
                                      size={14}
                                      className="text-violet-300"
                                    />
                                  </div>

                                  <span
                                    className="
                                      text-xs
                                      font-medium
                                      text-slate-400
                                    "
                                  >
                                    Meridian
                                  </span>

                                </div>


                                <div
                                  className="
                                    whitespace-pre-wrap
                                    text-sm
                                    leading-7
                                    text-slate-300
                                  "
                                >
                                  {message.content}
                                </div>

                              </div>
                            )}

                          </div>
                        )
                      )}

                    </div>
                  )}


                {/* RESEARCH LOADING */}

                {researching && (
                  <div className="mt-8">

                    <div
                      className="
                        rounded-2xl
                        border border-white/10
                        bg-white/[0.025]
                        p-5
                      "
                    >

                      <div
                        className="
                          mb-4 flex
                          items-center gap-3
                        "
                      >

                        <Loader2
                          size={17}
                          className="
                            animate-spin
                            text-violet-400
                          "
                        />

                        <span
                          className="
                            text-sm
                            text-slate-300
                          "
                        >
                          Meridian is researching...
                        </span>

                      </div>


                      <div
                        className="
                          grid grid-cols-1
                          gap-2
                          sm:grid-cols-2
                        "
                      >

                        {pipelineStage(
                          "Search Agent",
                          pipeline.search
                        )}

                        {pipelineStage(
                          "Reader Agent",
                          pipeline.reader
                        )}

                        {pipelineStage(
                          "RAG",
                          pipeline.rag
                        )}

                        {pipelineStage(
                          "Writer",
                          pipeline.writer
                        )}

                        {pipelineStage(
                          "Critic",
                          pipeline.critic
                        )}

                      </div>

                    </div>

                  </div>
                )}


                {/* ERROR */}

                {error && (
                  <div
                    className="
                      mt-6 rounded-xl
                      border border-red-500/20
                      bg-red-500/[0.05]
                      px-4 py-3
                      text-sm text-red-300
                    "
                  >
                    {error}
                  </div>
                )}

              </div>

            </div>


            {/* INPUT */}

            <div
              className="
                sticky bottom-0
                border-t border-white/10
                bg-[#050711]/95
                px-4 py-4
                backdrop-blur-xl
                sm:px-6
                lg:px-10
              "
            >

              <form
                onSubmit={handleResearch}
                className="
                  mx-auto max-w-4xl
                "
              >

                {uploadedDocuments.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {uploadedDocuments.map((document) => (
                      <div
                        key={document.id}
                        className="
                          flex items-center gap-2
                          rounded-xl
                          border border-white/10
                          bg-white/[0.04]
                          px-3 py-2
                          text-xs text-slate-400
                        "
                      >
                        <FileText
                          size={14}
                          className="shrink-0 text-violet-300"
                        />

                        <span className="max-w-[240px] truncate">
                          {document.filename}
                        </span>

                        <span className="text-slate-600">
                          {document.pages}p
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div
                  className="
                    flex items-end
                    gap-2
                    rounded-2xl
                    border border-white/10
                    bg-[#0a0e1a]
                    p-2
                    shadow-xl
                    shadow-black/20
                    transition
                    focus-within:border-violet-500/30
                  "
                >

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={handlePaperclipClick}
                    disabled={researching || uploadingFile}
                    className="
                      mb-0.5
                      rounded-xl p-2.5
                      text-slate-500
                      transition
                      hover:bg-white/5
                      hover:text-slate-300
                      disabled:cursor-not-allowed
                      disabled:opacity-30
                    "
                    title={
                      currentChatId
                        ? "Upload PDF"
                        : "Start a research chat to upload a PDF"
                    }
                  >
                    {uploadingFile ? (
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                    ) : (
                      <Paperclip size={18} />
                    )}
                  </button>


                  <textarea
                    value={question}
                    onChange={(event) =>
                      setQuestion(
                        event.target.value
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        !event.shiftKey
                      ) {
                        event.preventDefault();
                        handleResearch(event);
                      }
                    }}
                    disabled={researching}
                    rows={1}
                    placeholder="Ask anything..."
                    className="
                      max-h-32
                      min-h-[44px]
                      flex-1 resize-none
                      bg-transparent
                      px-2 py-2.5
                      text-sm
                      text-slate-200
                      outline-none
                      placeholder:text-slate-600
                      disabled:cursor-not-allowed
                    "
                  />


                  <button
                    type="submit"
                    disabled={
                      researching ||
                      !question.trim()
                    }
                    className="
                      flex h-10 w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-gradient-to-r
                      from-violet-600
                      to-blue-600
                      text-white
                      transition
                      hover:from-violet-500
                      hover:to-blue-500
                      disabled:cursor-not-allowed
                      disabled:opacity-30
                    "
                  >
                    {researching ? (
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <ArrowUp size={18} />
                    )}
                  </button>

                </div>


                <p
                  className="
                    mt-2 text-center
                    text-[11px]
                    text-slate-700
                  "
                >
                  Meridian can make mistakes.
                  Verify important information.
                </p>

              </form>

            </div>

          </section>


          {/* =================================================
              SOURCES PANEL
          ================================================= */}

          <aside
            className="
              hidden w-[320px]
              shrink-0
              border-l border-white/10
              bg-[#070a13]
              xl:block
            "
          >

            <div
              className="
                sticky top-0
                flex h-[calc(100vh-4rem)]
                flex-col
              "
            >

              <div
                className="
                  border-b border-white/10
                  px-5 py-4
                "
              >

                <div
                  className="
                    flex items-center
                    justify-between
                  "
                >

                  <div className="flex items-center gap-2">

                    <FileText
                      size={16}
                      className="text-slate-500"
                    />

                    <span
                      className="
                        text-sm
                        font-medium
                        text-slate-300
                      "
                    >
                      Sources
                    </span>

                  </div>


                  {sources.length > 0 && (
                    <span
                      className="
                        rounded-full
                        bg-white/5
                        px-2 py-0.5
                        text-[10px]
                        text-slate-500
                      "
                    >
                      {sources.length}
                    </span>
                  )}

                </div>

              </div>


              <div
                className="
                  flex-1 overflow-y-auto
                  p-4
                "
              >

                {sources.length === 0 ? (
                  <div
                    className="
                      flex h-full
                      items-center
                      justify-center
                      px-5 text-center
                    "
                  >
                    <div>

                      <FileText
                        size={24}
                        className="
                          mx-auto mb-3
                          text-slate-700
                        "
                      />

                      <p
                        className="
                          text-xs
                          leading-5
                          text-slate-600
                        "
                      >
                        Sources used by your
                        research will appear here.
                      </p>

                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">

                    {sources.map(
                      (source, index) => (
                        <a
                          key={
                            source.id ||
                            `${source.url}-${index}`
                          }
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="
                            block rounded-xl
                            border border-white/10
                            bg-white/[0.02]
                            p-4
                            transition
                            hover:border-violet-500/20
                            hover:bg-white/[0.04]
                          "
                        >

                          <div
                            className="
                              mb-2 flex
                              items-start gap-2
                            "
                          >

                            <span
                              className="
                                flex h-5 w-5
                                shrink-0
                                items-center
                                justify-center
                                rounded-md
                                bg-white/5
                                text-[10px]
                                text-slate-500
                              "
                            >
                              {index + 1}
                            </span>

                            <p
                              className="
                                line-clamp-2
                                text-xs
                                font-medium
                                leading-5
                                text-slate-300
                              "
                            >
                              {source.title ||
                                "Untitled source"}
                            </p>

                          </div>


                          {source.snippet && (
                            <p
                              className="
                                line-clamp-3
                                text-[11px]
                                leading-5
                                text-slate-600
                              "
                            >
                              {source.snippet}
                            </p>
                          )}

                        </a>
                      )
                    )}

                  </div>
                )}

              </div>


              {/* PIPELINE SUMMARY */}

              {(currentChatId ||
                researching) && (
                <div
                  className="
                    border-t border-white/10
                    p-4
                  "
                >

                  <p
                    className="
                      mb-3 text-[10px]
                      font-medium
                      uppercase
                      tracking-wider
                      text-slate-600
                    "
                  >
                    Pipeline
                  </p>


                  <div className="space-y-2">

                    {pipelineStage(
                      "Search",
                      pipeline.search
                    )}

                    {pipelineStage(
                      "Reader",
                      pipeline.reader
                    )}

                    {pipelineStage(
                      "RAG",
                      pipeline.rag
                    )}

                    {pipelineStage(
                      "Writer",
                      pipeline.writer
                    )}

                    {pipelineStage(
                      "Critic",
                      pipeline.critic
                    )}

                  </div>


                  {pipeline.final_score > 0 && (
                    <div
                      className="
                        mt-3 flex
                        items-center
                        justify-between
                        rounded-lg
                        bg-white/[0.03]
                        px-3 py-2
                      "
                    >
                      <span
                        className="
                          text-[11px]
                          text-slate-600
                        "
                      >
                        Critic score
                      </span>

                      <span
                        className="
                          text-xs
                          font-medium
                          text-slate-300
                        "
                      >
                        {pipeline.final_score}/10
                      </span>
                    </div>
                  )}

                </div>
              )}

            </div>

          </aside>

        </div>

      </main>


      {/* =================================================
          PRICING MODAL
      ================================================= */}

      {pricingOpen && (
        <div
          className="
            fixed inset-0 z-[100]
            flex items-center
            justify-center
            bg-black/70
            p-4
            backdrop-blur-md
          "
        >

          <div
            className="
              w-full max-w-4xl
              rounded-2xl
              border border-white/10
              bg-[#0b0f1b]
              p-5
              shadow-2xl
              shadow-black/50
              sm:p-7
            "
          >

            <div
              className="
                mb-6 flex
                items-start
                justify-between
              "
            >

              <div>

                <div
                  className="
                    mb-2 flex
                    items-center gap-2
                  "
                >

                  <Crown
                    size={18}
                    className="text-violet-300"
                  />

                  <span
                    className="
                      text-sm
                      font-medium
                      text-violet-300
                    "
                  >
                    Meridian Plans
                  </span>

                </div>


                <h2
                  className="
                    text-2xl
                    font-semibold
                    text-white
                  "
                >
                  Choose your plan
                </h2>


                <p
                  className="
                    mt-1 text-sm
                    text-slate-500
                  "
                >
                  More AI tokens for deeper research.
                </p>

              </div>


              <button
                onClick={() =>
                  setPricingOpen(false)
                }
                className="
                  rounded-lg p-2
                  text-slate-500
                  hover:bg-white/5
                  hover:text-white
                "
              >
                <X size={18} />
              </button>

            </div>


            <div
              className="
                grid gap-4
                md:grid-cols-3
              "
            >

              {[
                {
                  name: "Free",
                  price: "₹0",
                  tokens: "10,000 AI tokens/month",
                  features: [
                    "AI research",
                    "Research history",
                    "Source collection",
                  ],
                },
                {
                  name: "Pro",
                  price: "₹499",
                  tokens: "100,000 AI tokens/month",
                  features: [
                    "Everything in Free",
                    "More AI research",
                    "Advanced usage",
                  ],
                },
                {
                  name: "Premium",
                  price: "₹999",
                  tokens: "500,000 AI tokens/month",
                  features: [
                    "Everything in Pro",
                    "Highest token limit",
                    "Heavy research usage",
                  ],
                },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className="
                    flex flex-col
                    rounded-xl
                    border border-white/10
                    bg-white/[0.025]
                    p-5
                  "
                >

                  <p
                    className="
                      text-sm
                      font-medium
                      text-slate-300
                    "
                  >
                    {plan.name}
                  </p>


                  <div
                    className="
                      mt-3 flex
                      items-end gap-1
                    "
                  >

                    <span
                      className="
                        text-3xl
                        font-semibold
                        text-white
                      "
                    >
                      {plan.price}
                    </span>

                    {plan.name !== "Free" && (
                      <span
                        className="
                          pb-1
                          text-xs
                          text-slate-600
                        "
                      >
                        /month
                      </span>
                    )}

                  </div>


                  <p
                    className="
                      mt-2 text-xs
                      text-violet-300
                    "
                  >
                    {plan.tokens}
                  </p>


                  <div
                    className="
                      my-5 h-px
                      bg-white/10
                    "
                  />


                  <div className="flex-1 space-y-3">

                    {plan.features.map(
                      (feature) => (
                        <div
                          key={feature}
                          className="
                            flex items-start
                            gap-2
                          "
                        >

                          <Check
                            size={14}
                            className="
                              mt-0.5
                              shrink-0
                              text-slate-500
                            "
                          />

                          <span
                            className="
                              text-xs
                              text-slate-500
                            "
                          >
                            {feature}
                          </span>

                        </div>
                      )
                    )}

                  </div>


                  <button
                    onClick={() => {
                      if (plan.name === "Premium") {
                        handleUpgrade(plan.name);
                        return;
                      }

                      setPricingOpen(false);
                    }}
                    disabled={
                      stripeLoading ||
                      plan.name !== "Premium"
                    }
                    className="
                      mt-6 w-full
                      rounded-lg
                      border border-white/10
                      bg-white/[0.04]
                      px-4 py-2.5
                      text-xs
                      font-medium
                      text-slate-300
                      transition
                      hover:bg-white/[0.08]
                      hover:text-white
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    {plan.name === "Free"
                      ? "Current plan"
                      : plan.name === "Premium"
                        ? stripeLoading
                          ? "Opening Checkout..."
                          : "Upgrade to Premium"
                        : "Coming soon"}
                  </button>

                </div>
              ))}

            </div>

          </div>

        </div>
      )}

    </div>
  );
};


export default Research;