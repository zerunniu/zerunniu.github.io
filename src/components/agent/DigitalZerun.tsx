import { useEffect, useMemo, useRef, useState } from "react";
import {
  allowedEvidence,
  allowedPaths,
  projectPath,
  researchFilterPath,
  resumePath,
} from "../../lib/agentAllowlist";
import "./agent.css";

type TranscriptLine = { role: "user" | "agent"; message: string };
type Mode = "text" | "voice";
type ElevenSdk = typeof import("@elevenlabs/react");
type ClientTools = import("@elevenlabs/react").ClientTools;
type UseConversationHook = ElevenSdk["useConversation"];

const sessionErrorMessages: Record<string, string> = {
  visitor_limit:
    "This device reached the three-session trial limit. Please wait 10 minutes.",
  daily_limit: "Digital Zerun has reached today's session limit.",
  turnstile_failed: "Cloudflare verification failed. Please try again.",
  elevenlabs_auth_failed:
    "The ElevenLabs Runtime Key is invalid or missing ElevenAgents access.",
  elevenlabs_agent_not_found:
    "The configured ElevenLabs Agent ID could not be found.",
  elevenlabs_quota_exhausted:
    "The ElevenLabs plan or Runtime Key credit quota has been exhausted.",
  voice_service_unavailable:
    "The voice provider is temporarily unavailable. Static research mode remains available.",
};

const fallbackAnswers = [
  {
    keys: ["brave", "first author", "controlled evidence"],
    answer:
      "I am Digital Zerun, an AI representation. Zerun is first author of BRAVE and led its algorithm design, literature review, experimental design, implementation, and experimental deployment. The paper is under review at TMLR.",
  },
  {
    keys: ["research", "interest", "focus"],
    answer:
      "Zerun works on reliable and efficient AI systems, including federated learning, semantic communication, calibration, distributed optimisation, and resource-constrained ML.",
  },
  {
    keys: ["teaching", "unsw", "usyd"],
    answer:
      "Zerun is currently a Casual Academic Tutor at the University of Sydney and a Casual Academic at UNSW Sydney.",
  },
  {
    keys: ["wasecom", "wireless", "semantic"],
    answer:
      "WaSeCom studies distributionally robust wireless semantic communication with large AI models and was published in IEEE JSAC in 2026.",
  },
  {
    keys: ["fedeq", "equilibrium", "federated"],
    answer:
      "FeDEQ studies federated deep equilibrium learning over heterogeneous, resource-constrained edge networks.",
  },
];

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: Record<string, unknown>,
      ) => string;
      execute: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

function dispatchOrb(state: string) {
  window.dispatchEvent(
    new CustomEvent("digital-zerun-state", { detail: state }),
  );
}

function safeNavigate(path: string) {
  if (!allowedPaths.has(path))
    return "Navigation blocked: path is not in the local allowlist.";
  window.location.assign(path);
  return `Opening ${path}`;
}

function useStaticConversation() {
  return {
    status: "disconnected",
    isSpeaking: false,
    startSession: async () => "",
    endSession: async () => undefined,
    sendUserMessage: () => undefined,
  } as unknown as ReturnType<UseConversationHook>;
}

function AgentInterface({
  workerUrl,
  turnstileSiteKey,
  useConversationHook,
  runtimeReady,
  loadingRuntime,
  onActivate,
}: {
  workerUrl: string;
  turnstileSiteKey: string;
  useConversationHook: UseConversationHook;
  runtimeReady: boolean;
  loadingRuntime: boolean;
  onActivate: () => void;
}) {
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("text");
  const [consent, setConsent] = useState(false);
  const [notice, setNotice] = useState("Ready for verified questions");
  const [starting, setStarting] = useState(false);
  const turnstileHost = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string>("");
  const tokenResolver = useRef<((token: string) => void) | null>(null);
  const configured = Boolean(workerUrl && turnstileSiteKey);

  const clientTools = useMemo<ClientTools>(
    () => ({
      navigateTo: (params) =>
        safeNavigate(typeof params.path === "string" ? params.path : ""),
      openProject: (params) => {
        const slug = typeof params.slug === "string" ? params.slug : "";
        const path = projectPath(slug);
        if (!path)
          return "Project blocked: slug is not in the local allowlist.";
        window.location.assign(path);
        return `Opening ${slug}`;
      },
      highlightEvidence: (params) => {
        const id = typeof params.id === "string" ? params.id : "";
        if (!allowedEvidence.has(id)) return "Evidence target blocked.";
        const target = document.getElementById(id);
        if (!target) return "Evidence is not present on this page.";
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.classList.add("agent-highlight");
        window.setTimeout(
          () => target.classList.remove("agent-highlight"),
          2400,
        );
        return `Highlighted ${id}`;
      },
      filterResearch: (params) => {
        const tag = typeof params.tag === "string" ? params.tag : "";
        const path = researchFilterPath(tag);
        if (!path) return "Research filter blocked.";
        window.location.assign(path);
        return `Filtering research by ${tag}`;
      },
      openResume: (params) => {
        const variant =
          typeof params.variant === "string" ? params.variant : "";
        const path = resumePath(variant);
        if (!path) return "Resume variant blocked.";
        window.location.assign(path);
        return `Opening ${variant} resume`;
      },
    }),
    [],
  );

  const conversation = useConversationHook({
    onConnect: () => {
      setNotice("Session active · maximum 5 minutes");
      dispatchOrb("listening");
    },
    onDisconnect: () => {
      setNotice("Session ended · local transcript cleared");
      setTranscript([]);
      dispatchOrb("idle");
    },
    onError: () => {
      setNotice(
        "Voice service unavailable · static research mode remains available",
      );
      dispatchOrb("error");
    },
    onMessage: ({ role, message }) =>
      setTranscript((items) =>
        [
          ...items,
          {
            role: role === "agent" ? "agent" : "user",
            message,
          } as TranscriptLine,
        ].slice(-12),
      ),
    onModeChange: ({ mode: next }) =>
      dispatchOrb(next === "speaking" ? "speaking" : "listening"),
  });

  useEffect(() => {
    if (!configured || !runtimeReady || !turnstileHost.current) return;
    const initialize = () => {
      if (!window.turnstile || !turnstileHost.current || widgetId.current)
        return;
      widgetId.current = window.turnstile.render(turnstileHost.current, {
        sitekey: turnstileSiteKey,
        execution: "execute",
        appearance: "interaction-only",
        callback: (token: string) => tokenResolver.current?.(token),
        "error-callback": () => tokenResolver.current?.(""),
        "expired-callback": () => tokenResolver.current?.(""),
      });
    };
    if (window.turnstile) initialize();
    else {
      const script = document.createElement("script");
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = initialize;
      document.head.appendChild(script);
      return () => {
        script.parentNode?.removeChild(script);
      };
    }
  }, [configured, runtimeReady, turnstileSiteKey]);

  const getTurnstileToken = () =>
    new Promise<string>((resolve) => {
      if (!window.turnstile || !widgetId.current) return resolve("");
      tokenResolver.current = resolve;
      window.turnstile.execute(widgetId.current);
      window.setTimeout(() => resolve(""), 15000);
    });

  const startSession = async () => {
    if (!configured || !runtimeReady || (mode === "voice" && !consent)) return;
    setStarting(true);
    setNotice("Verifying private session…");
    dispatchOrb("thinking");
    try {
      const turnstileToken = await getTurnstileToken();
      if (!turnstileToken)
        throw new Error("Turnstile verification was not completed.");
      const response = await fetch(
        `${workerUrl.replace(/\/$/, "")}/api/voice/session`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ turnstileToken }),
          credentials: "omit",
        },
      );
      if (!response.ok) {
        const result = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(
          sessionErrorMessages[result.error ?? ""] ??
            "The private session could not be started.",
        );
      }
      const { signedUrl } = (await response.json()) as { signedUrl: string };
      conversation.startSession({
        signedUrl,
        connectionType: "websocket",
        textOnly: mode === "text",
        clientTools,
      });
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Session could not start.",
      );
      dispatchOrb("error");
    } finally {
      setStarting(false);
      if (widgetId.current) window.turnstile?.reset(widgetId.current);
    }
  };

  const askFallback = () => {
    const question = input.trim();
    if (!question) return;
    const lower = question.toLowerCase();
    const match = fallbackAnswers.find((item) =>
      item.keys.some((key) => lower.includes(key)),
    );
    const answer =
      match?.answer ??
      "I do not have reliable information for that question. Please use the project pages, publications, CV, or contact Zerun directly.";
    const userLine: TranscriptLine = { role: "user", message: question };
    const agentLine: TranscriptLine = { role: "agent", message: answer };
    setTranscript((items) => [...items, userLine, agentLine].slice(-12));
    setInput("");
  };

  const sendText = () => {
    if (!input.trim()) return;
    if (conversation.status === "connected") {
      conversation.sendUserMessage(input.trim());
      setInput("");
    } else askFallback();
  };

  const endSession = () => {
    if (conversation.status === "connected") conversation.endSession();
    setTranscript([]);
    setNotice("Session ended · local transcript cleared");
    dispatchOrb("idle");
  };

  return (
    <div className="agent-console">
      <div className="agent-identity">
        <div
          className={`agent-orb mode-${conversation.isSpeaking ? "speaking" : conversation.status === "connected" ? "listening" : "idle"}`}
          aria-hidden="true"
        >
          <span>ZN</span>
        </div>
        <div>
          <div className="agent-kicker">
            <span>AI clone</span>
            <span>
              {configured ? "private endpoint" : "static research mode"}
            </span>
          </div>
          <h2>Meet Digital Zerun.</h2>
          <p>
            I’m Digital Zerun, an AI representation using Zerun’s authorised
            cloned voice. I answer only from a screened public knowledge file
            and cannot make commitments on Zerun’s behalf.
          </p>
        </div>
      </div>
      <div className="agent-terminal">
        <div className="terminal-bar">
          <span className="status-dot"></span>
          <span>{notice}</span>
          <span>zero retention target</span>
        </div>
        <div className="mode-switch" aria-label="Conversation mode">
          <button
            className={mode === "text" ? "is-active" : ""}
            onClick={() => setMode("text")}
          >
            Text
          </button>
          <button
            className={mode === "voice" ? "is-active" : ""}
            onClick={() => setMode("voice")}
          >
            Voice
          </button>
        </div>
        <div className="transcript" aria-live="polite">
          {transcript.length === 0 ? (
            <div className="starter-prompts">
              <button
                onClick={() => setInput("What did Zerun contribute to BRAVE?")}
              >
                What did Zerun contribute to BRAVE?
              </button>
              <button
                onClick={() => setInput("What research roles does Zerun hold?")}
              >
                What research roles does Zerun hold?
              </button>
              <button
                onClick={() => setInput("Explain WaSeCom in one minute.")}
              >
                Explain WaSeCom in one minute.
              </button>
            </div>
          ) : (
            transcript.map((line, index) => (
              <p className={line.role} key={`${line.role}-${index}`}>
                <span>{line.role === "agent" ? "Digital Zerun" : "You"}</span>
                {line.message}
              </p>
            ))
          )}
        </div>
        {mode === "voice" && (
          <label className="consent">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
            />{" "}
            I understand that microphone access starts only for this session and
            the AI voice is a clone.
          </label>
        )}
        <div className="agent-input">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && sendText()}
            placeholder={
              mode === "text"
                ? "Ask about research, projects, or experience…"
                : "Voice session uses your microphone after consent"
            }
            disabled={mode === "voice"}
          />
          {mode === "text" && <button onClick={sendText}>Send</button>}
          {configured && conversation.status === "disconnected" && (
            <button
              className="connect"
              disabled={
                loadingRuntime ||
                starting ||
                (runtimeReady && mode === "voice" && !consent)
              }
              onClick={runtimeReady ? startSession : onActivate}
            >
              {loadingRuntime
                ? "Loading private runtime…"
                : starting
                  ? "Verifying…"
                  : runtimeReady
                    ? `Start ${mode} session`
                    : "Activate private agent"}
            </button>
          )}
          {conversation.status === "connected" && (
            <button className="end" onClick={endSession}>
              End & clear
            </button>
          )}
        </div>
        {!configured && (
          <p className="agent-fallback">
            Voice activation awaits the owner’s Cloudflare and ElevenLabs
            account setup. Verified static answers and all site navigation
            remain available now.
          </p>
        )}
        <div ref={turnstileHost} className="turnstile-host"></div>
      </div>
      <aside>
        <span>Boundaries</span>
        <ul>
          <li>No salary, visa, or private-contact advice.</li>
          <li>No unpublished reviews or confidential material.</li>
          <li>No promises of jobs, meetings, or collaboration.</li>
          <li>Unknown facts are stated as unknown.</li>
        </ul>
        <a href="/privacy">Read the voice and data policy →</a>
      </aside>
    </div>
  );
}

export default function DigitalZerun(props: {
  workerUrl: string;
  turnstileSiteKey: string;
}) {
  const [sdk, setSdk] = useState<ElevenSdk | null>(null);
  const [loadingRuntime, setLoadingRuntime] = useState(false);

  const activate = async () => {
    if (sdk || loadingRuntime) return;
    setLoadingRuntime(true);
    try {
      setSdk(await import("@elevenlabs/react"));
    } finally {
      setLoadingRuntime(false);
    }
  };

  if (!sdk) {
    return (
      <AgentInterface
        {...props}
        useConversationHook={useStaticConversation as UseConversationHook}
        runtimeReady={false}
        loadingRuntime={loadingRuntime}
        onActivate={activate}
      />
    );
  }

  const ConversationProvider = sdk.ConversationProvider;
  return (
    <ConversationProvider>
      <AgentInterface
        {...props}
        useConversationHook={sdk.useConversation}
        runtimeReady
        loadingRuntime={false}
        onActivate={activate}
      />
    </ConversationProvider>
  );
}
