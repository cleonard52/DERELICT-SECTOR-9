# DERELICT: SECTOR 9

A retro 16-bit sci-fi survival horror Metroidvania set aboard the *USCSS Acheron*, a deep-space research vessel being consumed from the outside by an alien cosmic organism.

## Features
- **5 Interconnected Biomes (50+ Rooms):** Cryo-Deck, Overgrown Hydroponics, Magma Reactor Core, Zero-G Exterior Hull, and Sub-Level Bio-Labs.
- **3-Act Spreading Infection:** As you defeat sector bosses, the external alien growth breaches the hull—mutating earlier rooms, plunging sectors into darkness, and reanimating fallen crew.
- **Survival Horror Mechanics:** Directional Visor Flashlight with battery management, *Aliens*-style Motion Tracker radar pings, and power-routing breaker puzzles.
- **Suit Upgrades & Arsenal:** Plasma Cutter, Phase Dash, Cryo-Blaster, Thruster Pack, Mag-Boots, plus 10 hidden Energy Tanks and 6 Weapon/Suit Modules.
- **5 Multi-Phase Bosses:** *The Root-Maw*, *Cauterizer-09*, *The Void-Leech Leviathan*, *The Stalker (Patient Zero)*, and *The Acheron Amalgam*.
- **Auto-Map & Save System:** Full grid map (`M` or `Tab`), browser `localStorage` saves at Recharge Pods, and JSON save export/import.

## Repository Folder Structure
Place the files into your repository using this layout:
```text
derelict-sector-9/
├── index.html
├── README.md
├── manifest.json
├── css/
│   └── style.css
├── data/
│   └── logs.js
└── js/
    ├── audio.js
    ├── sprites.js
    ├── world.js
    ├── entities.js
    └── engine.js
```

## Controls
- **Move:** `A / D` or `Left / Right Arrows`
- **Jump / Double Jump / Hover:** `W`, `Space`, or `Up Arrow`
- **Aim Up / Down:** `Hold Up / Down` while firing
- **Fire Weapon:** `J` or `Z`
- **Switch Weapon (Plasma / Cryo):** `K` or `X`
- **Phase Dash:** `L`, `C`, or `Shift`
- **Toggle Visor Flashlight:** `F`
- **Interact / Read Terminal / Save:** `E` or `Enter`
- **Toggle Full Ship Map:** `M` or `Tab`
- **Pause / Save Export Menu:** `Escape`

## Playing via GitHub Pages
1. Push this repository to GitHub.
2. Go to **Settings > Pages**.
3. Under **Source**, select `Deploy from a branch` (`main` / `/root`) and click **Save**.
4. Open the generated GitHub Pages URL to play directly in your browser.
