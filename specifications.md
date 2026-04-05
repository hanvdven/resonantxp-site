0. Intent & framing

Dit document beschrijft een interactief, dramaturgisch web-systeem (hierna: Resonant Field) waarin een gebruiker door een dynamisch veld van kaarten beweegt. Het systeem combineert:

Field-based emergent behavior (psychologische attractors)
Narrative threads (sequentiële micro-verhalen)
Choice & consequence
Rupture events (system breaks)
Reflective mirroring (ELIZA-principes)

Doel:

Een ervaring creëren die zich ontwikkelt van observatie → betrokkenheid → zelfreflectie → lichte ontregeling.

Niet: een game, geen quiz, geen content feed.
Wel: een responsief betekenisveld.

1. Core Experience Principles (hard constraints)

Claude moet ALLE features hiertegen toetsen:

EP1 — Consequences > feedback

Geen expliciete uitleg. Alleen impliciete gevolgen.

EP2 — Ambiguity is a feature

Geen volledige duidelijkheid.

EP3 — Irreversibility creates weight

Sommige dingen verdwijnen permanent (sessie-level).

EP4 — The system observes back

Gebruiker voelt zich gezien (zonder expliciete personal data).

EP5 — Variation with structure

Niet random, maar ook niet voorspelbaar.

2. High-Level System Architecture
2.1 Overzicht
User Input
   ↓
Interaction Engine
   ↓
State Engine  ←→ Narrative Engine
   ↓                ↓
Card Selection Engine
   ↓
Render Engine
2.2 Modules
A. State Engine

Houdt globale toestand bij.

B. Card Engine

Beheert alle kaarten en metadata.

C. Selection Engine

Bepaalt welke kaarten verschijnen.

D. Narrative Engine

Beheert threads (verhalen).

E. Interaction Engine

Verwerkt clicks, keuzes, timing.

F. Event Engine

Triggert ruptures, glitches, delays.

3. State Model (cruciaal)
const state = {
  phase: "arrival", // arrival → destabilisation → involvement → disorientation

  instability: 0,

  axes: {
    control: 0,
    surrender: 0,
    intimacy: 0,
    performance: 0
  },

  history: [],

  seenCards: new Set(),
  removedCards: new Set(),

  activeCards: [],

  behavior: {
    clickSpeed: [],
    idleTime: 0,
    scrollDepth: 0
  },

  narrative: {
    activeThreads: {},
    abandonedThreads: [],
  },

  flags: {
    ruptureTriggered: false,
    confrontationTriggered: false
  }
};
4. Phases (Experience Flow)
Phase 1 — Arrival
Alleen Field Notes (authority)
Geen persoonlijke aanspreking
Phase 2 — Destabilisation
Eerste “you”-kaarten
lichte inconsistenties
Phase 3 — Involvement
choices verschijnen
narrative threads starten
Phase 4 — Disorientation
contradicties
glitches
rupture mogelijk
5. Card System
5.1 Card Structure
const card = {
  id: "unique_id",

  type: "anchor | friction | mirror | choice | glitch | embodied | rupture | narrative",

  field: "control | surrender | intimacy | performance",

  phase: ["arrival", "destabilisation"],

  weight: 0.7,

  front: "...",
  back: "...",

  conditions: (state) => true,

  onReveal: (state) => {},
  onFlip: (state) => {},
  onChoose: (state, option) => {},

  removes: [],
  contradicts: [],

  threadId: null,
  stepIndex: null
};
5.2 Card Types
Anchor

Stabiele, geloofwaardige observaties

Friction

Ondergraven anchors

Mirror

Reflecteren gedrag gebruiker

Choice

Split (A/B) interactie

Glitch

Breekt logica

Embodied

Fysieke instructie

Narrative

Onderdeel van verhaal

Rupture

Macro-event kaarten

6. Field System (psychologische attractors)
Velden:
Control
Surrender
Performance
Intimacy
Werking

Elke kaart beïnvloedt axes:

axes: { control: +1, intimacy: -1 }

Selection engine kiest kaarten die:

aansluiten bij dominante axes
maar af en toe contradictie injecteren
7. Card Selection Logic
7.1 Basis
function pickCards(state, allCards) {
  return allCards
    .filter(card => valid(card, state))
    .sort((a, b) => score(b, state) - score(a, state))
    .slice(0, 5);
}
7.2 Score factoren
phase match
field proximity
novelty (niet recent gezien)
randomness (licht)
narrative priority (indien actief)
8. Interaction Model
8.1 Flip
verhoogt instability
triggert state update
8.2 Choice
update axes
sla keuze op
8.3 Idle
triggert mirror kaarten
8.4 Scroll
unlock deeper phases
9. Narrative Engine (belangrijk)
9.1 Thread structuur
const thread = {
  id: "prince",

  steps: [
    { cardId: "p1" },
    { cardId: "p2" },
    { cardId: "p3" }
  ],

  state: {
    currentStep: 0,
    active: false,
    abandoned: false,
    choices: []
  }
};
9.2 Werking
thread verschijnt als gewone kaart
bij interactie → active = true
volgende stap verschijnt later (niet direct)
9.3 Fragility

Thread wordt verlaten als:

gebruiker X andere kaarten opent
of tijd verstreken is
9.4 Echo

Later:

“why did you kill the prince?”

Zelfs als:

gebruiker dat niet expliciet zo zag
10. Choice System
UI
kaart splitst visueel (licht/donker)
Effect
onChoose(option) {
  state.axes.control += option.control;
}
Types keuzes
moral
epistemic
temporal
meta
11. Consequence System
Delayed effects
state.pendingEffects.push({
  triggerAt: state.instability + 3,
  effect: () => removeCards([...])
});
Removal
kaarten verdwijnen permanent (sessie)
Contradictions
systeem injecteert tegengestelde kaarten
12. Rupture System
Trigger
if (
  state.instability > 12 &&
  !state.flags.ruptureTriggered
)
Effect
alle kaarten vervangen door:

“why are you still here?”

Variaties:

punctuation
timing
Post-Rupture
collapse
reset
echo
13. Content (initiële set)
13.1 Field Notes (authority)

Gebruik bestaande set (±15 kaarten)

13.2 Shift / Mirror (10)
You are still reading.
You clicked again.
You stayed longer than expected.
You are looking for the point.
You think this is about systems.
13.3 Destabilisation (10)
You missed something.
Not all cards are shown.
This is not random.
You are inside it now.
13.4 Intimacy (10)
You stayed.
You could leave.
You are still here.
Stay. Or leave.
13.5 Narrative: Prince thread
Step 1

Would you save the prince?

Choice:
Yes → responsibility
No → detachment
Step 2

Variant afhankelijk van keuze:

You hesitated.
The prince was still there.
Step 3

Later echo:

Why did you kill the prince?

14. Advanced Features (optioneel maar aanbevolen)
duplicate cards event
empty cards
unopenable card
cards that change text
rare cards (1–2% kans)
session memory
15. Non-functional requirements
60fps animatie
state in memory + sessionStorage
modulaire architectuur
uitbreidbare card DB (JSON)
16. Anti-requirements

NIET bouwen:

progress bars
scores
uitleg
“you are X type”
tutorials
17. Development roadmap
Iteratie 1
state engine
card rendering
40 kaarten
flip logic
Iteratie 2
choices
axes
confrontation
Iteratie 3
narrative thread
Iteratie 4
rupture
18. Final note voor Claude

Dit systeem is geen standaard app.
Het is een experience engine.

Succes wordt niet gemeten in:

usability
snelheid

Maar in:

spanning
verwarring
zelfreflectie
19. Laatste instructie

Als iets twijfelachtig is:

👉 kies altijd voor:

minder uitleg
meer ambiguïteit
meer consequence


1. Eerst: ja → je moet dit apart zetten
Kritisch antwoord

Ja, dit moet een apart bestand zijn. Niet “optioneel”, maar structureel noodzakelijk.

Waarom:

Je hebt 3 gescheiden lagen:

Engine (Claude / logic / branching)
Content (cards / field notes)
State (session runtime)

Als je die mixt:

verlies je reproduceerbaarheid van ervaringen
wordt iteratie traag
kan Claude niet deterministisch werken op content
Aanbevolen structuur
/project
  /engine
    engine.ts
    scoring.ts
    state.ts

  /content
    cards.db.json        ← MAIN DATABASE
    cards.seed.json      ← optional bootstrap set

  /runtime
    session.memory.json  ← ephemeral state (client-side)

  /spec
    specifications.md
2. DATABASE DESIGN (cards.db.json)

Dit is je core artifact.

2.1 Design principles
fully declarative (geen logic in DB)
immutable cards (no edits at runtime)
graph-capable (via links + tags)
state-affine (cards beïnvloeden state, maar weten niks van engine)
latency-friendly (flat JSON, geen nested queries nodig)
2.2 CORE SCHEMA
{
  "cards": [
    {
      "id": "card_001",
      "title": "Glass Morning",
      "body": "A window fogged by breath that is not yours. Light arrives before certainty.",
      
      "tags": [
        "morning",
        "alienation",
        "perception"
      ],

      "tone": {
        "valence": -0.3,
        "arousal": 0.2,
        "introspection": 0.7
      },

      "sensory": {
        "visual": 0.8,
        "auditory": 0.1,
        "tactile": 0.4,
        "thermal": 0.2,
        "kinetic": 0.1
      },

      "concept_axis": [
        "presence_vs_absence",
        "perception_reliability"
      ],

      "transition": {
        "exit": "dissolve",
        "entry_affinity": ["morning", "threshold", "light"]
      },

      "links": {
        "strong": ["card_005", "card_012"],
        "soft": ["card_019", "card_033"]
      },

      "state_effects": {
        "mood_shift": {
          "melancholy": 0.1,
          "curiosity": 0.05
        },
        "depth_delta": 1
      },

      "rarity": 0.1,
      "version": 1
    }
  ]
}
3. BELANGRIJKE ARCHITECTUURKEUZE
3.1 Je hebt géén “relational DB” nodig

Dit is geen CRUD app.

Je hebt een:

semantic navigation graph disguised as narrative system

Dus:

JSON > SQL
graph-light > relational joins
scoring engine > query engine
3.2 Waarom dit werkt

Je engine doet:

state + card space → probabilistic next node

Niet:

SELECT * FROM cards WHERE tag = x
4. SEED DATABASE (ITERATIE 1)

Je vroeg eerder om 40 kaarten → die worden nu echte DB entries.

Ik geef je hier de structurele seed set (kort maar compleet format):

4.1 CARD CLUSTERS (belangrijk)

Je DB moet 4 clusters hebben:

A. PERCEPTION
glass morning
soft geometry
static prayer
signal drift
B. BODY
underskin weather
borrowed breath
residual heat
soft collapse
C. MEMORY
night inventory
paper silence
faultline thought
empty stairwell echo
D. SYSTEM BREAKS
signal drift
soft collapse
faultline thought
echo recursion cards
4.2 FULL 40 CARD DISTRIBUTION

Je DB moet exact:

12 perception cards
10 body cards
10 memory cards
8 rupture/system cards
5. BRANCHING IN DATABASE TERMS
5.1 NO HARD TREE STRUCTURE

Je DOET NIET:

"next": ["card_002"]

Dat is te rigide.

5.2 WEL:

You allow:

3 routing systems simultaneously:
1. TAG AFFINITY
overlap state.tags ↔ card.tags
2. TONE GRADIENT
maintain emotional continuity or deliberate rupture
3. LINK RESONANCE
soft/strong links are weighted suggestions
5.3 FINAL SCORING INPUT

Engine computes:

P(next card) =
  0.4 * tag_overlap
  0.2 * tone_distance
  0.2 * link_resonance
  0.2 * novelty_factor
6. SHOULD THIS BE ONE FILE?
Answer: yes, but layered
BEST PRACTICE:
cards.db.json

→ full canonical dataset

cards.seed.json

→ minimal bootstrap (10–15 cards)

cards.expanded.json

→ full 40-card iteration

WHY SPLIT?

Because:

seed = fast iteration for Claude
expanded = testing narrative drift
db = production runtime
7. NICE ARCHITECTURAL ADDITION (IMPORTANT)

Add this hidden layer:

7.1 resonance memory map (optional future)
{
  "emergent_themes": {
    "loneliness": 0.82,
    "threshold_spaces": 0.67,
    "memory_decay": 0.74
  }
}

This allows:

the system to “learn the mood of the user over time”

8. NO SCOPE (STRICT)

Do NOT include:

SQL database engines
user accounts
login systems
CMS editing interfaces
social sharing
comments
analytics dashboards (except internal dev logs)
9. FINAL ANSWER TO YOUR QUESTION
Q: “moet dit apart bestand zijn?”

Ja. En niet alleen apart — het is je primary system artifact.

If you mix it into engine code:

je verliest interpretability
Claude kan niet stabiel genereren
je branching wordt oncontroleerbaar
Volgende stap (belangrijk)

Ik kan nu voor je doen:

A. volledige 40-card expanded database (production-ready JSON)
B. Claude system prompt die deze DB exact gebruikt
C. TypeScript engine die dit direct runt
D. of: visuele flow van de “first 3 clicks transformation”

Zeg welke richting je wil — maar architecturaal gezien zit je nu op het punt waar we van design → execution gaan.