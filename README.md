<div align="center">

<img src="./readme-assets/banner.svg" alt="IIBl4z3MasterII - Minecraft Bedrock Developer" width="100%" />

<br>

<a href="https://github.com/IIBl4z3MasterII"><img src="https://img.shields.io/badge/GitHub-IIBl4z3MasterII-0a0d14?style=for-the-badge&logo=github&logoColor=white" /></a>
<a href="https://bl4z3community.neocities.org/"><img src="https://img.shields.io/badge/Website-Bl4z3Community-58A6FF?style=for-the-badge&logo=googlechrome&logoColor=white" /></a>
<a href="https://www.curseforge.com/members/iibl4z3master/projects"><img src="https://img.shields.io/badge/CurseForge-Projects-F16436?style=for-the-badge&logo=curseforge&logoColor=white" /></a>
<a href="https://www.youtube.com/@bl4z3master"><img src="https://img.shields.io/badge/YouTube-%40bl4z3master-FF0000?style=for-the-badge&logo=youtube&logoColor=white" /></a>
<a href="https://discord.gg/kBNHNxXbMM"><img src="https://img.shields.io/badge/Discord-Community-5865F2?style=for-the-badge&logo=discord&logoColor=white" /></a>

<br>

<img src="https://komarev.com/ghpvc/?username=IIBl4z3MasterII&label=Profile%20Views&color=58A6FF&style=flat-square" />
<img src="https://img.shields.io/github/followers/IIBl4z3MasterII?label=Followers&style=flat-square&color=58A6FF" />

</div>

<img src="./readme-assets/divider.svg" width="100%" height="4" alt="" />

## 👨‍💻 About me

I build systems, tools and add-ons for **Minecraft Bedrock Edition**. My main field is the **Script API** with JavaScript: gameplay systems, reusable utilities, custom commands, UI and complete add-ons.

- 🪨 Bedrock developer: Script API · JSON UI · Behavior & Resource Packs
- 🧩 I build reusable modules that plug into different projects
- 🧠 Clean, modular code with real documentation
- 🎓 Systems engineering student, always learning new Bedrock APIs

> **I don't just make add-ons. I build reusable systems around the Bedrock ecosystem.**

<img src="./readme-assets/divider.svg" width="100%" height="4" alt="" />

## 🧰 Tech stack

<div align="center">

<img src="https://img.shields.io/badge/Minecraft%20Bedrock-1.20.70%2B-62B47A?style=for-the-badge&logo=minecraft&logoColor=white" />
<img src="https://img.shields.io/badge/Script%20API-Stable-2D2D2D?style=for-the-badge" />
<img src="https://img.shields.io/badge/JSON%20UI-Development-9B59B6?style=for-the-badge" />

<br>

<img src="https://img.shields.io/badge/@minecraft/server-2.6.0-4CAF50?style=flat-square" />
<img src="https://img.shields.io/badge/@minecraft/server--ui-2.0.0-9C27B0?style=flat-square" />
<img src="https://img.shields.io/badge/Dynamic%20Properties-Bedrock-58A6FF?style=flat-square" />

<br><br>

<img src="https://skillicons.dev/icons?i=js,java,html,css,json,postgres,mysql,git,github,vscode,idea,maven&theme=dark" />

</div>

<img src="./readme-assets/divider.svg" width="100%" height="4" alt="" />

## 🧩 What I build

<table>
<tr>
<td width="50%" valign="top">

### ⚙️ Gameplay systems

- Custom commands
- Custom death messages
- Ban system
- Inventory systems
- Mob stacking
- World management
- Custom drops
- Data persistence

</td>
<td width="50%" valign="top">

### 🧰 Developer utilities

- Region utilities
- Cooldowns
- Raycasting
- Inventory helpers
- Particle helpers
- Armor set detection
- Enchantment utilities
- UI templates

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🎨 JSON UI

- Custom interfaces and layouts
- Reusable components
- HUD modifications
- UI pack analysis

</td>
<td width="50%" valign="top">

### 📦 Complete add-ons

- Behavior Packs + Resource Packs
- Custom systems and UI
- Textures and glyphs
- Script API integration

</td>
</tr>
</table>

<img src="./readme-assets/divider.svg" width="100%" height="4" alt="" />

## 🚀 Featured project: Bedrock Utils

Reusable **Minecraft Bedrock Script API** utilities, gameplay systems, complete add-ons and technical documentation.

<img src="https://img.shields.io/badge/version-0.0.1-blue?style=flat-square" />
<img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" />
<img src="https://img.shields.io/badge/platform-Bedrock%20Edition-orange?style=flat-square" />
<img src="https://img.shields.io/badge/language-JavaScript-yellow?style=flat-square" />

<details>
<summary><b>📁 Repository structure</b></summary>

```text
bedrock-utils/
├── helpers/          # Reusable and atomic utilities
│   ├── chat-moderation/
│   ├── cooldown/
│   ├── coordinates/
│   ├── enchant-helper/
│   ├── inventory-helper/
│   ├── lore-durability/
│   ├── armor-set-detector/
│   ├── particle-helper/
│   ├── raycaster/
│   ├── region/
│   ├── rtp-helper/
│   ├── template-ui/
│   ├── timer/
│   └── index.js
├── systems/          # Complete gameplay systems
│   ├── ban-system/
│   ├── death-custom-msg/
│   ├── drops-in-inventory/
│   ├── mob-stacker/
│   ├── custom-commands/
│   ├── world-manager/
│   └── index.js
├── addons/           # Complete installable add-ons
│   └── shop-ui/
│       ├── bp/
│       └── rp/
├── assets/           # Static assets
│   └── glyphs/
└── docs/             # Bedrock technical documentation
    └── json-ui/
```

</details>

```bash
git clone https://github.com/IIBl4z3MasterII/bedrock-utils.git
```

```js
import { Region } from "./helpers/region/index.js";
import { CooldownManager } from "./helpers/cooldown/index.js";

// or through the aggregator
import { Region, CooldownManager, Timer } from "./helpers/index.js";
```

**[View Bedrock Utils on GitHub →](https://github.com/IIBl4z3MasterII/bedrock-utils)**

<img src="./readme-assets/divider.svg" width="100%" height="4" alt="" />

## 📚 Current focus

```mermaid
mindmap
  root((Bedrock))
    Script API
      JavaScript
      Events
      Systems
      Dynamic Properties
    JSON UI
      Layouts
      Components
      HUD
    Add-ons
      Behavior Packs
      Resource Packs
      Pack integration
    Software
      Java
      Databases
      Web
```

```mermaid
journey
  title My Bedrock workflow
  section Idea
    Design the system: 4: Me
    Define reusable modules: 5: Me
  section Build
    Script API + JavaScript: 5: Me
    JSON UI + Resource Pack: 4: Me
  section Release
    Document in Bedrock Utils: 4: Me
    Publish on CurseForge: 5: Me, Community
```

<img src="./readme-assets/divider.svg" width="100%" height="4" alt="" />

## 📊 GitHub

<div align="center">

<a href="https://github.com/IIBl4z3MasterII/bedrock-utils">
  <img src="https://img.shields.io/github/stars/IIBl4z3MasterII/bedrock-utils?style=for-the-badge&logo=github&color=58A6FF&labelColor=0a0d14" />
  <img src="https://img.shields.io/github/last-commit/IIBl4z3MasterII/bedrock-utils?style=for-the-badge&logo=git&color=9B59B6&labelColor=0a0d14" />
  <img src="https://img.shields.io/github/commit-activity/m/IIBl4z3MasterII/bedrock-utils?style=for-the-badge&color=4CAF50&labelColor=0a0d14" />
  <img src="https://img.shields.io/github/languages/top/IIBl4z3MasterII/bedrock-utils?style=for-the-badge&color=F7DF1E&labelColor=0a0d14" />
</a>

<br><br>

<kbd>
  <img src="https://streak-stats.demolab.com?user=IIBl4z3MasterII&theme=tokyonight&hide_border=true&background=0a0d14" alt="GitHub streak" />
</kbd>

</div>

<img src="./readme-assets/divider.svg" width="100%" height="4" alt="" />

## 💳 Payment methods

<div align="center">

<img src="./readme-assets/cards.svg" alt="Accepted cards: Visa, Mastercard, American Express, debit and credit" width="600" />

<br><br>

<img src="https://img.shields.io/badge/Visa-Accepted-1A1F71?style=for-the-badge&logo=visa&logoColor=white" />
<img src="https://img.shields.io/badge/Mastercard-Accepted-EB001B?style=for-the-badge&logo=mastercard&logoColor=white" />
<img src="https://img.shields.io/badge/Amex-Accepted-006FCF?style=for-the-badge&logo=americanexpress&logoColor=white" />

<br>

<img src="https://img.shields.io/badge/PayPal-Worldwide-00457C?style=for-the-badge&logo=paypal&logoColor=white" />
<img src="https://img.shields.io/badge/Yape-Peru%20only%20🇵🇪-742284?style=for-the-badge" />
<img src="https://img.shields.io/badge/Global66-International%20transfers-FF3D57?style=for-the-badge" />

</div>

<br>

| Method | Where | Best for |
| :-- | :-- | :-- |
| 💳 **Visa · Mastercard · Amex** | 🌎 Worldwide | Card payments |
| 🅿️ **PayPal** | 🌎 Worldwide | International clients |
| 📱 **Yape** | 🇵🇪 Peru only | Instant local payments |
| 🌐 **Global66** | 🌎 International | Low-fee transfers between countries |

> Payment details are shared privately once we agree on the project. Contact me on **[Discord](https://discord.gg/kBNHNxXbMM)**.

<img src="./readme-assets/divider.svg" width="100%" height="4" alt="" />

## 💼 Open for commissions

Custom Minecraft Bedrock add-ons, Script API systems, JSON UI and full Behavior Pack + Resource Pack projects.

```mermaid
flowchart LR
    A[💬 Contact on Discord] --> B[📝 Define scope]
    B --> C[💳 Agree payment method]
    C --> D[⚙️ Development]
    D --> E[📦 Delivery]
```

## 🌐 Find me

<div align="center">

<a href="https://bl4z3community.neocities.org/"><img src="https://img.shields.io/badge/Website-Bl4z3%20Community-58A6FF?style=for-the-badge&logo=googlechrome&logoColor=white" /></a>
<a href="https://bl4z3community.neocities.org/portafolio/"><img src="https://img.shields.io/badge/Portfolio-View%20projects-111827?style=for-the-badge&logo=github&logoColor=white" /></a>
<a href="https://www.curseforge.com/members/iibl4z3master/projects"><img src="https://img.shields.io/badge/CurseForge-Projects-F16436?style=for-the-badge&logo=curseforge&logoColor=white" /></a>
<a href="https://www.youtube.com/@bl4z3master"><img src="https://img.shields.io/badge/YouTube-%40bl4z3master-FF0000?style=for-the-badge&logo=youtube&logoColor=white" /></a>
<a href="https://discord.gg/kBNHNxXbMM"><img src="https://img.shields.io/badge/Discord-Join%20community-5865F2?style=for-the-badge&logo=discord&logoColor=white" /></a>

<br><br>

### 🪨 Building systems for Bedrock, one module at a time.

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0a0d14,50:161B22,100:58A6FF&height=120&section=footer" width="100%" />

<sub>Personal developer profile · Minecraft Bedrock community projects · Not affiliated with Mojang or Microsoft.</sub>

</div>
