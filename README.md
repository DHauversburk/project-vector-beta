# Project Vector (Beta Preview v1.4.2)

> **Secure, Anonymous Medical Scheduling System**  
> *Designed for high-compliance environments requiring Zero-Trust architecture.*

![Status](https://img.shields.io/badge/Status-Beta_Simulation-amber) ![Security](https://img.shields.io/badge/Security-Zero_Trust-blue) ![Compliance](https://img.shields.io/badge/Compliance-FIPS_140-green)

## ⚠️ Beta Simulation Mode
This repository is currently configured for **Offline Simulation**. It demonstrates the full UI/UX and scheduling logic without connecting to a live database. All data is stored locally in your browser and resets when you clear your cache (or use the "Factory Reset" button in Security Settings).

**No API Keys Required.** You can clone and run this project immediately.

---

## 🚀 Quick Start (Run Locally)

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/project-vector-beta.git

# 2. Enter directory
cd project-vector-beta

# 3. Install dependencies
npm install

# 4. Start the simulation server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 Test Credentials (Mock Mode)

Use these credentials to test different user roles in the simulation.

### 1. Patient Access (Token Mode)
*Select "Secure Token" on the login screen.*
*PIN for all patients:* `1111`

| Token | Identity |
| :--- | :--- |
| `M-8821-X4` | **Patient Alpha** (General) |
| `M-3392-L9` | **Patient Bravo** (Follow-up) |
| `M-1102-P2` | **Patient Charlie** (New Intake) |

### 2. Provider Access (Email Mode)
*Select "Email Login" on the login screen.*
*Password for all:* `password`

| Email | Role |
| :--- | :--- |
| `doc.mh@vector.mil` | **Mental Health (Green Team)** |
| `doc.pt@vector.mil` | **Physical Therapy (Gold Team)** |
| `doc.om@vector.mil` | **Operational Medicine** |

### 3. Admin Access (Email Mode)
- **Email:** `alex.admin@vector.mil`
- **Password:** `password`
- *Role: System Administrator (Super User)*

---

## 🛠️ Technology Stack
- **Frontend:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS (Slate/Zinc Palette)
- **State Management:** LocalStorage Persistence (Mock Adapter)
- **Icons:** Lucide React
- **PWA:** Workbox (Offline Capabilities)

## 📦 Deployment
This project is optimized for deployment on Vercel or Netlify.
**Important:** Do NOT add Supabase environment variables for the Beta deployment. Leaving them empty ensures the application stays in "Simulation Mode".

## 📄 License
Internal / Confidential / Beta Preview
