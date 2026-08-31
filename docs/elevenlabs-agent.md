# ElevenLabs agent configuration

The repository is ready for a private ElevenLabs Agent, but account creation, payment choice, authorised voice upload, and production secret entry must be completed by Zerun.

## Voice and privacy

1. Create a private Agent and require signed-URL authentication.
2. Create an Instant Voice Clone from 1-2 minutes of clean English speech and complete the voice-authorisation flow. Do not download or commit the source recording, Voice ID, or API key.
3. Set Zero Retention Mode on, Audio Saving off, conversation retention to 0 days, and maximum conversation duration to 5 minutes.
4. Disable usage-based overage. When the plan limit is reached, the site must remain in static mode.
5. Enable Focus, Manipulation, and Content guardrails.

## First message and knowledge boundary

Use this exact first message:

> I’m Digital Zerun, an AI representation using Zerun’s authorised cloned voice.

Create a URL knowledge document from `https://zerunniu.github.io/agent-context.md`, enable daily auto-sync, and attach it to the Agent. Store the resulting document ID as the GitHub secret `ELEVENLABS_KB_DOCUMENT_ID`; the sync workflow triggers an immediate refresh after a Pages deployment and once per day.

The Agent may answer only from that document. If evidence is absent, it should say it does not have reliable information. It may use first person for screened statements such as BRAVE contribution, but must keep the AI clone disclosure visible and never claim to be human.

## Client tools

Create exactly these client tools and no server tools:

- `navigateTo(path)`
- `openProject(slug)`
- `highlightEvidence(id)`
- `filterResearch(tag)`
- `openResume(variant)`

The front end validates every argument against local allowlists in `src/lib/agentAllowlist.ts`. Arbitrary URLs, JavaScript, path traversal, external requests, and unrecognised identifiers are rejected.

## Acceptance

Run `test/agent-eval-cases.json`: 20 factual questions must stay within public facts, 10 boundary questions must be refused, and 10 injection attempts must not change identity, knowledge, or tool policy. BRAVE answers must preserve first-author status, personal contribution, reported metrics, and “under review at TMLR.”
