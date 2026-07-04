# QueueFlow

> **External Commitment & Latency Management for High-Performance Teams.**

QueueFlow is a premium, enterprise-grade workspace built to manage, track, and resolve the "Commitment Gap"—the critical blind spot in project workflows where tasks are blocked by external counterparties (vendors, clients, legal counsel, or contractors).

Live Url:https://queueflow-webapp.vercel.app/

---

## 🌌 Core Concept: The Commitment Gap

Traditional project management tools are designed for **internal velocity**. They help you track what **your team** needs to build. However, workflows frequently break down when a task leaves your plate:

*   *Traditional PM (Jira/Trello):* You mark "Send Contract to Client" as Done. The task disappears from your active view.
*   *The Gap:* The client has the contract, but has not signed it. You have zero visibility on how long they've held it until the project deadline is missed.
*   *QueueFlow:* Tracks the transaction from the moment it is handed off, monitors the latency of the counterparty, computes real-time urgency scores, and prepares AI-assisted nudge communications to speed up resolutions.

---

## ⚔️ QueueFlow vs. Jira & Asana

Traditional PM platforms fail at tracking external dependencies because they treat every item as an internal assignment. Here is how QueueFlow differs:

| Feature / Dimension | Traditional PM (e.g., Jira, Asana) | QueueFlow |
| :--- | :--- | :--- |
| **Primary Focus** | Internal task completion & sprint velocity. | External counterparty latency & obligation tracking. |
| **Status Engine** | Static columns (To Do, In Progress, Done). | Dynamic status based on real-time latency thresholds. |
| **Metric of Success** | Burn-down charts, story points completed. | Counterparty delay metrics, average resolution speed. |
| **Blocked State** | Passive "Blocked" flag (requires manual checking). | Active, color-coded, score-based urgency alerts. |
| **Communication** | Internal comments for team members. | AI-powered follow-up email composers (Nudge Engine). |
| **Counterparties** | Not represented (or tracked as static text fields). | Modeled as entities (Person, Company, Institution). |

---

## ⚡ Key Features & Functionality

### 1. Dynamic Latency & Urgency Engine
At the heart of QueueFlow is an automated calculation engine that monitors items in real-time. Each waiting item has a calculated **Urgency Score (0-100)**:
*   **Waiting (Score 0-44):** The counterparty is still within the acceptable response window.
*   **Due Soon (Score 45-79):** The deadline is approaching or 70%+ of typical latency has elapsed.
*   **Overdue (Score 80-100):** The deadline has passed or typical latency is exceeded.

### 2. AI Nudge Composer
Draft follow-ups in seconds. QueueFlow generates template drafts in three communication tones:
*   **Warm:** Friendly check-in for close partners.
*   **Neutral:** Professional follow-up focusing on schedules.
*   **Firm:** Direct, urgent request referencing project timelines.
*   *Integration:* Syncs the follow-up log automatically, resetting the days waited while retaining the decaying communication history.

### 3. High-Contrast Kanban Board
A deep-space, high-performance visual board. Columns correspond to real-time status weights (`Waiting`, `Due Soon`, `Overdue`, and `Resolved`). Supports responsive drag-and-drop layout scaling for all screen sizes.

### 4. Interactive Latency Analytics & Reports
*   Visualize overall average response delays by counterparty.
*   Track resolution distribution curves.
*   Generate weekly reports summarizing blocked processes and slow-responding counterparties.

---

## ⚙️ Mathematical Urgency Logic

Urgency is calculated dynamically on every page load or item update.

### 1. Ratio Formula
When an item has a specific **Expected By** date, the engine calculates the remaining runway:
$$\text{Days Remaining} = \text{Expected Date} - \text{Today}$$

*   **$\text{Days Remaining} < 0$ (Overdue):**
    $$\text{Urgency Score} = \min(100, 80 + (\text{Overdue Days} \times 5))$$
*   **$\text{Days Remaining} \le 2$ or $\frac{\text{Days Remaining}}{\text{Total Expected Days}} \le 0.3$ (Due Soon):**
    $$\text{Urgency Score} = 45 + \left(\left(1 - \frac{\text{Days Remaining}}{\text{Total Expected Days}}\right) \times 34\right)$$
*   **Normal (Waiting):**
    $$\text{Urgency Score} = \max\left(0, \left(1 - \frac{\text{Days Remaining}}{\text{Total Expected Days}}\right) \times 44\right)$$

When no explicit deadline is set, it falls back to the typical latency defined by the type of ask:
$$\text{Ratio} = \frac{\text{Days Waited since Last Contact}}{\text{Typical Latency Days}}$$

### 2. Decaying Follow-Up Cadence
To prevent spamming counterparties, QueueFlow calculates the next suggested follow-up date using a multiplier that grows with each consecutive contact:
*   **0 prior follow-ups:** Next follow-up at $1.0 \times \text{Expected Duration}$
*   **1 prior follow-up:** Next follow-up at $1.5 \times \text{Expected Duration}$
*   **2+ prior follow-ups:** Next follow-up at $(1.5 + 0.75 \times (\text{Count} - 1)) \times \text{Expected Duration}$

---

## 🎨 Design & Aesthetic System

QueueFlow is built with a premium **Deep Space Dark Theme** designed to look modern, clean, and professional:
*   **Harmony Palette:** Dark obsidian backgrounds (`#05060b`) offset by glassmorphic containers, vibrant indicator colors, and smooth glowing drop-shadows.
*   **Micro-Animations:** Fluid transitions (`cubic-bezier(0.16, 1, 0.3, 1)`) on card hovers, slider moves, and tab selections.
*   **Dynamic Scroll Indicators:** Active page section highlights follow the viewport using Intersection Observers in the navigation header.

---

## 🚀 Getting Started

### 1. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 2. Database Migration
Initialize and migrate the SQLite database via Prisma:
```bash
npx prisma db push
```

### 3. Running the Server
Start the Next.js development server locally:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the app workspace.
