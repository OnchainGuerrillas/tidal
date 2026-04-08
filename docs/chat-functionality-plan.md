# Tidal — Chat Functionality Plan

*Last updated: 8 April 2026*

---

## Purpose

This document outlines how chat should work across Home, Pool, and Amplify in the Tidal prototype.

The goal is not to lock in backend architecture or production persistence. The goal is to define a coherent frontend-facing product model for how users:

- start from a simple chat-first entrypoint
- branch into Pool or Amplify when the conversation becomes investment-operational
- continue using chat to research, refine, or act on ideas without collapsing every conversation into the same workspace model

This remains a prototype document. All examples assume mocked data only.

---

## The Current Prototype Shape

The current prototype already points toward two different chat patterns that need to be unified.

### Home

Home is currently a generic prompt-first entrypoint. It behaves like a broad "talk to Tidal" surface:

- the user starts from a simple prompt composer
- the interaction is general and not scoped to a specific Pool or Amplify object
- suggestions focus on broad market and investment questions

### Pool

Pool already behaves like a persistent investment workspace:

- a Pool exists independently as a named investment workspace
- the Pool route has an overview state that is not itself a chat thread
- multiple chats can exist within the same Pool
- focused chats can be created from existing Pool context such as positions, recommendations, and discovery items

This is important because it already shows a useful product truth: not every investment interaction should immediately alter the workspace, but chats still need to inform investment decisions.

### Amplify

Amplify currently behaves like a workspace surface with strategy content and chat, but not yet a multi-threaded workspace model:

- Amplify has its own independent strategy surface
- the conversation is currently embedded in the workspace
- the prototype does not yet treat Amplify as a persistent workspace with multiple dedicated threads the way Pool does

### Core Product Tension

The design question is how to unify these surfaces into one coherent chat model without losing the value of Pool and Amplify as independent investment objects.

The user should be able to:

- start with a broad market or strategy question
- stay in a general chat when that is enough
- create or open a Pool or Amplify when the discussion becomes operational
- use existing Pools or Amplify workspaces as context without always turning that into a dedicated workspace thread
- go deeper with a dedicated workspace thread when focused work is needed

---

## Three Viable Approaches

### 1. Entity-Owned Chats

In this model, Pool or Amplify is the canonical owner of chat.

How it works:

- every meaningful conversation belongs to a specific Pool or Amplify
- starting from Home is mainly a routing step into one of those workspaces
- the main value is workspace clarity and strong investment history

Pros:

- very clear ownership model
- strong workspace continuity
- easy to explain dedicated research history within a Pool or Amplify

Cons:

- weak for broad market discussion
- awkward for early-stage exploration before the user knows whether they need Pool or Amplify
- awkward when a single conversation touches both diversified investing and looping strategy ideas

Assessment:

This is strong for execution, but too rigid for the natural-language exploratory behavior Tidal wants to encourage.

### 2. Global Chat-First

In this model, all chats are global and Pool / Amplify objects are created from chat later.

How it works:

- Home is the real primary surface
- chats are the main object
- Pool and Amplify are created or attached after enough intent has emerged

Pros:

- simplest natural-language mental model
- strongest support for broad Solana discussion and fluid ideation
- easiest way to let one conversation span multiple themes

Cons:

- weaker workspace continuity
- weaker sense that Pool and Amplify are durable investment surfaces
- harder to present a clear history of focused investment work

Assessment:

This is strong for discovery, but too weak on persistent investment structure.

### 3. Hybrid Chat-First With Promoted Workspace Threads

In this model, general chats exist independently, while Pool and Amplify remain durable workspaces with their own focused threads.

How it works:

- users start from a general chat-first experience
- a general chat can reference zero, one, or many Pools / Amplify workspaces over time
- those references appear as lightweight linked tags or metadata on the chat
- when the user wants to go deeper, Tidal creates a dedicated Pool or Amplify thread
- the dedicated thread is seeded from an AI summary of relevant context, not a full transcript copy

Pros:

- preserves broad conversational exploration
- preserves Pool and Amplify as independent investment objects
- supports one broad conversation feeding multiple workspaces
- gives the user a clear way to move from exploration into focused execution or strategy work

Cons:

- slightly more complex than a single-owner model
- requires the UI to distinguish between reference tags and dedicated workspace threads
- requires explicit promotion rules so the user understands when a new focused thread is being created

Assessment:

This is the strongest fit for the current Tidal vision and should be the recommended direction for the prototype.

---

## Recommended Product Model

The recommended model is a **hybrid chat-first system with promoted workspace threads**.

### Core Concepts

**Global chat**  
A broad conversation in the main sidebar chat list. It may have no linked entities, one linked entity, or many linked entities.

**Workspace entity**  
A Pool or Amplify object that exists independently of chat.

**Linked context tag**  
A lightweight reference showing that a global chat has discussed or referenced a specific Pool or Amplify workspace.

**Dedicated workspace thread**  
A focused conversation that belongs to one Pool or one Amplify workspace.

**Promotion**  
The act of taking part of a general chat and turning it into a dedicated workspace thread.

### Ownership Rules

The recommended ownership model should be explicit:

- general chats are stored independently from Pools and Amplify
- Pools and Amplify exist independently from chats
- a general chat can reference multiple entities
- a dedicated workspace thread belongs to exactly one workspace
- the same user intent can begin in one general chat and later branch into multiple dedicated threads, one per workspace where needed

This is the key distinction:

- **reference is not ownership**
- **promotion creates ownership**

### Why This Fits Tidal

This model matches the actual product behavior Tidal wants to support:

- users often begin with vague intent
- the right surface only becomes obvious after the AI interprets the conversation
- one conversation may legitimately touch both Pool and Amplify
- users need a way to keep research broad while still preserving focused workspace history when they move into active investment planning

---

## Recommended Home Funnel

Home should remain the generic chat-first entrypoint, but its job is not merely to accept prompts. Its job is to help the user land in the right operating surface at the right moment.

### Funnel Rules

- the user starts with a simple generic chat interface
- the AI interprets intent from natural language
- if the user is describing a diversified investment strategy, the AI proposes creating or opening a Pool
- if the user is describing a recurring loop, reinvestment flow, or composable strategy graph, the AI proposes creating or opening an Amplify workspace
- if no suitable workspace already exists, the AI prompts the user to create it
- the AI should not silently auto-create a Pool or Amplify
- if the user is only discussing the market or asking general Solana questions, the chat should stay general until workspace-worthy intent appears

### Practical Design Implication

The AI is not deciding ownership silently. It is deciding whether the conversation has reached the point where a workspace would help, then asking the user to confirm that move.

That confirmation matters because:

- creating a Pool implies a persistent investment container
- creating an Amplify implies a persistent strategy object
- some conversations should remain lightweight and exploratory

---

## Using Existing Pool Or Amplify As Context

The prototype should support two distinct modes when an existing workspace is involved in a conversation.

### 1. Context-Only Use

In this mode:

- the user asks about an existing Pool or Amplify from within a general chat
- the general chat gains a visible Pool or Amplify tag
- no dedicated workspace thread is created
- nothing new appears in that workspace's thread list

This mode is appropriate when the user wants to:

- ask a broad question about an existing investment object
- compare it against market conditions
- reference it during exploratory discussion without switching into focused workspace work

### 2. Focused Workspace Use

In this mode:

- the user wants to go deeper within a specific Pool or Amplify
- Tidal offers to create a dedicated workspace thread
- the new thread is seeded with an AI summary of the relevant context from the general chat
- the dedicated thread then continues independently inside that workspace

This mode is appropriate when the user wants to:

- deeply review a Pool recommendation or allocation decision
- refine an Amplify loop or strategy graph
- continue a focused investment workflow without dragging the full general transcript into the workspace

### Recommended Rule

Using an existing Pool or Amplify as context should **not** automatically create a workspace thread.

The user should only get a dedicated workspace thread when they explicitly choose to deepen or operationalize that context.

---

## Navigation And Sidebar Behavior

The sidebar should reflect the distinction between broad conversational exploration and focused workspace work.

### Recommended Sidebar Structure

- keep a **global Chats** section in the sidebar
- each general chat can show zero or more linked entity tags such as `Pool` or `Amplify`
- keep Pool and Amplify sections as independent workspace navigation areas
- each Pool or Amplify workspace can show its own dedicated nested threads

### What Tags Mean

Tags are for reference only. They tell the user:

- this chat has discussed a specific Pool or Amplify
- context exists here
- the workspace has informed the conversation

Tags do **not** mean:

- the chat belongs to that workspace
- the chat must appear in that workspace's thread list

### What Dedicated Workspace Threads Mean

Dedicated nested threads should represent focused research, editing, or execution-oriented conversation that belongs to that one workspace.

For the prototype, the cleaner rule is:

- general chats live in the global chat system
- dedicated workspace threads live primarily under the relevant workspace
- if the product later wants a unified "view all conversations" layer, that can be added later

This avoids duplication confusion in the first version of the model.

---

## Example User Journeys

### 1. General Market Chat -> Pool

1. The user starts on Home and asks, "What's going on in Solana yield right now?"
2. The chat stays general because the user is still exploring.
3. The conversation narrows toward stablecoin deployment and portfolio construction.
4. Tidal identifies that this is a diversified investment intent and proposes creating a Pool.
5. The user confirms.
6. A Pool is created.
7. Later, the user promotes a recommendation discussion into a dedicated Pool thread for deeper review.

### 2. General Market Chat -> Pool + Amplify

1. The user starts broad and discusses both safer yield allocation and more advanced looping ideas.
2. The general chat gains both Pool and Amplify tags.
3. No dedicated workspace thread is created yet because the discussion is still broad.
4. The user later chooses to deepen the portfolio side, creating a focused Pool thread.
5. The user separately chooses to deepen the looping strategy side, creating a focused Amplify thread.
6. Both focused threads originate from the same broad parent conversation, but continue independently inside their own workspaces.

### 3. Existing Pool As Context Without Linking

1. The user opens a general chat and asks about whether an existing Pool allocation still makes sense.
2. The chat shows a Pool tag to reflect that the workspace is part of the discussion.
3. The conversation stays inside the general chat.
4. No dedicated Pool thread is created until the user asks to go deeper.

### 4. Existing Amplify As Context With Promotion

1. The user asks how to improve an existing loop.
2. Tidal recognizes that the user is now asking for deep strategy-editing help.
3. Tidal offers to open or create a dedicated Amplify thread.
4. The dedicated thread is seeded with an AI summary of the relevant loop discussion.
5. The thread then continues independently inside the Amplify workspace.

---

## Frontend-Facing Type Concepts

This document should inform the prototype's UI model without over-specifying backend schemas.

The following concepts are sufficient for future frontend planning:

```ts
type Chat = {
  id: string;
  title: string;
  preview: string;
  messages: ChatMessage[];
  links: ChatLink[];
};

type ChatLink = {
  id: string;
  entityType: "pool" | "amplify";
  entityId: string;
  label: string;
  mode: ContextMode;
};

type WorkspaceEntity = {
  id: string;
  type: "pool" | "amplify";
  name: string;
};

type WorkspaceThread = {
  id: string;
  workspaceType: "pool" | "amplify";
  workspaceId: string;
  title: string;
  summarySeed: string;
  messages: ChatMessage[];
  source?: PromotionSource;
};

type PromotionSource = {
  sourceChatId: string;
  summary: string;
  promotedFromEntityIds?: string[];
};

type ContextMode = "reference-only" | "focused-thread";
```

### Important Distinctions

- `Chat` is not the same as `WorkspaceThread`
- `ChatLink` is a lightweight reference, not ownership
- `WorkspaceThread` is single-workspace and focused
- `PromotionSource` captures that a workspace thread can be created from a general chat summary rather than copied transcript history

This is enough structure to guide future mock-data and UI planning without pretending the prototype already knows its production persistence model.

---

## Recommended Defaults

For the prototype, the following defaults should be treated as the working direction:

- recommended model: hybrid chat-first with promoted workspace threads
- Home behavior: AI analyzes intent and prompts creation or opening of Pool / Amplify rather than auto-creating silently
- general chats may reference both Pool and Amplify at once
- dedicated workspace threads are created only when the user wants deeper focused work
- dedicated threads start from an AI summary of relevant context, not a copied full transcript
- the main sidebar should contain global chats with linked entity tags
- Pool and Amplify should each have their own dedicated nested thread areas for focused conversations

---

## What This Plan Should Achieve

If followed, this plan gives Tidal a chat model that:

- supports broad Solana conversation
- supports persistent Pool and Amplify workspaces
- avoids forcing every conversation into premature workspace ownership
- preserves focused investment history where it matters
- gives the user a clear mental model for how exploration turns into action

That balance is the main design goal. Tidal should feel conversational first, but not vague. Pool and Amplify should feel durable, but not restrictive.
