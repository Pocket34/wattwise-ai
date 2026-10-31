# ⚡ WATTWISE AI
### *"Samajhdaar Ghar. Kam Bill. Behtar Kal."* (समझदार घर • कम बिल • बेहतर कल)

> **WattWise AI** is a futuristic, adaptive intelligent home-energy companion. It is NOT a generic blue/green SaaS dashboard. It transforms home energy from a passive monthly bill shock into an active, living ecosystem:
>
> **OBSERVES → UNDERSTANDS → SIMULATES → PREDICTS → RECOMMENDS → AUTOMATES**

---

## 🌟 Key Highlights & Signature Features

1. **Home Energy Pulse (Living Heartbeat)**
   - Custom animated living core that visually breathes in tune with household power draw.
   - Accelerates and intensifies into an alert glow during high evening surges (>3 kW); calms into a serene eco rhythm when optimizations are applied.
   - Real-time telemetry: Instant Load (W), Active Devices, Daily Consumption (kWh), Estimated Cost (₹), and Efficiency Rating (%).

2. **Autonomous Leak Detective**
   - Heuristic anomaly engine identifying hidden **vampire standby loads** (e.g. 28W continuous TV/STB draw), **inefficient thermal setpoints** (AC set below 24°C), and **forgotten circuits**.
   - Displays statistical confidence scores (e.g. 96%), daily waste in kWh and ₹.
   - Three actionable options: **Investigate** (deep diagnosis), **Fix Now** (immediately updates device state & slashes load), and **Ignore**.

3. **"WHAT IF I CHANGE MY HABITS?" (What-If Simulation Lab)**
   - Interactive sliders for AC temperature, daily runtime, geyser minutes, ceiling fan hours, BLDC fan upgrade, and peak-hour load shifting.
   - Live animated comparative delta graph showing Current vs Optimized Monthly Bill, Units Saved (kWh), and CO₂ Avoidance.
   - **"Apply This Plan"** button immediately writes the optimized parameters into the active smart home database!

4. **1-Click Smart Home Demo (Judge Walkthrough in Under 2 Minutes)**
   - Click the prominent **"Start Demo"** button in the navigation bar.
   - Step 1: Simulate heavy evening load surge (~3,800W).
   - Step 2: Leak Detective catches vampire standby & sub-optimal AC temperature.
   - Step 3: WattWise explains the root cause and suggests 1-click remedies.
   - Step 4: Apply optimization — power consumption drops by 42%, bill forecast shrinks, and celebratory confetti fires!

5. **Hindi & English Multilingual Voice & Audio Experience**
   - First-visit AI greeting in authentic Hindi with optional voice narration via the browser's `SpeechSynthesis` API.
   - Micro-tactile feedback synthesized procedurally with browser-safe **Web Audio API**: soft tick on navigation, electronic click on toggles, futuristic sweep on simulation switch, and harmonic chime on successful optimization. Zero external audio file dependencies.
   - Audio and Voice toggles accessible right from the top navigation bar and settings.

6. **Smart Rules Automation Engine**
   - Active automation policies: empty-home cutoff, peak tariff load shedding (>3.5 kW), midnight vampire annihilator, and adaptive sleep curve.
   - Full CRUD capability + instant **"Test Run"** execution against the live database.

7. **BEE Progressive Slab Bill Forecaster**
   - Real-world Indian residential slab calculator (Slab 1 @ ₹4.20, Slab 2 @ ₹6.50, Slab 3 @ ₹8.00, Slab 4 @ ₹10.20).
   - Shows projected month-end bill, previous month comparison, and configurable flat vs progressive slab models.

8. **Carbon Impact & Climate Dividend**
   - Real-time translation of electrical savings to environmental metrics: kg CO₂ avoided (0.82 kg/kWh BEE factor), equivalent mature trees, and EV distance offset.
   - Dynamic **"Your Impact Story"** narrative.

---

## 🏛️ System Architecture

```text
┌────────────────────────────────────────────────────────┐
│                      CLIENT TIER                       │
│  React 19 + TypeScript + Vite + Tailwind CSS           │
│  - Web Audio API Procedural Synthesizer               │
│  - Web SpeechSynthesis (Hindi / English)               │
│  - Living Energy Pulse SVG / Canvas                   │
└───────────────────────────▲────────────────────────────┘
                            │ REST API (JSON)
┌───────────────────────────▼────────────────────────────┐
│                  WATTWISE BACKEND                      │
│  Node.js (v24+) + Express                              │
│  - WattWise Intelligence Engine (Deterministic AI)     │
│  - Anomaly Detector & Leak Classifier                  │
│  - Predictive Slab Tariff Engine                       │
│  - Smart Rules Evaluator                               │
└───────────────────────────▲────────────────────────────┘
                            │ Synchronous SQL
┌───────────────────────────▼────────────────────────────┐
│                    DATABASE TIER                       │
│  Native Node.js SQLite (node:sqlite DatabaseSync)      │
│  - Zero native C++ compilation dependencies            │
│  - Tables: appliances, leaks, rules, goals, settings   │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
- Node.js (v20+ or v24+)
- npm (v10+)

### 1. Start the Backend Server
```bash
cd server
npm install
npm start
```
*The backend starts at `http://localhost:3001` with the SQLite database initialized and seeded.*

### 2. Start the Frontend Client
In a new terminal:
```bash
cd client
npm install
npm run dev
```
*The client starts at `http://localhost:5173`.*

---

## 🔒 100% Offline & Free Prototype
- **Zero Paid APIs required**: No OpenAI, Anthropic, or Gemini API keys needed.
- Uses the local deterministic **WattWise Intelligence Engine** for instant, reliable hackathon demonstration.
- Full state persistence in local SQLite (`server/src/db/wattwise.sqlite`).
