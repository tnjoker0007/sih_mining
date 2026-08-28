# Walkthrough - MineGuard AI Module 3: Command Center (Theme Update)

**Theme Specification Source**: `MineGuard_Module_3_Dashboard_Theme.docx`  
**Status**: 100% Implemented & Verified

---

## 🎨 Theme & UI/UX Design System Changes

We have revamped the entire user interface and dashboard layout to strictly adhere to the **Modern Industrial Safety Command Center** design specification from `MineGuard_Module_3_Dashboard_Theme.docx`.

### 1. Global Shared Design System
- **Product Style**: Modern industrial safety command center with dark dashboard appearance, high readability, and strong emergency contrast.
- **Typography**: Clean sans-serif typography using `Inter` with monospace numerical HUD elements.
- **Dedicated Safety Status Colors**:
  - `SAFE`: Green (`#10b981`)
  - `WARNING`: Amber / Yellow (`#f59e0b`)
  - `CRITICAL`: Red (`#ef4444`) with subtle pulse animation
  - `INFO`: Blue (`#3b82f6`)
  - **Operational Accent**: Blue (`#2563eb`) across all navigation & controls.
  - **Accessibility**: Statuses always pair color with text labels and distinct icons.

---

## 📐 Wireframe & Dashboard Layout Implementation

The Command Center dashboard has been restructured to match the exact wireframe:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ TOP BAR: Mine: Apex Deep Horizon | System Health: OK | Notifications (Alerts) | User   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ KPI CARDS: [Safe Zones]  [Warning Zones]  [Critical Zones]  [Active Alerts] [Open Inc] │
├────────────────────────────────────────────────────┬───────────────────────────────────┤
│ MAIN AREA:                                         │ CRITICAL ALERTS & INCIDENTS PANEL │
│ Large Interactive Digital Mine Map                 │ Pinned unacknowledged critical    │
│ 2D layout: Shafts, Galleries, Zones, Nodes, Miners │ alerts with 1-click SAR escalate  │
├────────────────────────────────────────────────────┼───────────────────────────────────┤
│ SECOND ROW:                                        │                                   │
│ Zone Risk Summary (Depth, Subsidence, Gas, Occ)    │ Active SOS & Miner Vitals Summary │
├────────────────────────────────────────────────────┼───────────────────────────────────┤
│ BOTTOM ROW:                                        │                                   │
│ Rescue Progress Timeline (Step-by-step SAR)        │ Recent Activity & Alert Stream    │
└────────────────────────────────────────────────────┴───────────────────────────────────┘
```

---

## 🗺️ Digital Mine Map Enhancements
- **Clean 2D Vector Layout**: Visualizing Shaft 1, Shaft 2, galleries, cross-cuts, and refuge bays.
- **Side Detail Panel**: Clicking any Zone, IoT Sensor Node (Module 1), or Smart Band Miner (Module 2) opens a dedicated right-side inspection drawer with live vitals, battery, signal, and emergency triggers.
- **Hazard Heatmap & Evacuation Overlays**: Zones colored by risk rating with pulsing animations on critical events.

---

## 🚀 How to View the Updated Theme

The server is running on port 5000:
👉 **[http://localhost:5000](http://localhost:5000)**

- **Administrator**: `admin` / `admin123`
- **Control Room Operator**: `operator` / `operator123`
- **Rescue Team Lead**: `rescue_lead` / `rescue123`
*(Or use the 1-click demo login buttons on the login screen).*
