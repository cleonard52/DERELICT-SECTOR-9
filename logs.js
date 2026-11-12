// DERELICT: SECTOR 9 — Crew Black-Box Logs & Terminal Transmissions
const GAME_LOGS = {
  log_01: {
    title: "BLACK-BOX LOG #01 // CRYO-BAY SUPERVISOR",
    meta: "DECK A — CRYO-DECK | DAY 01 OF ANOMALY",
    text: "Proximity alarms woke half the night shift at 03:14 ship time. The Acheron drifted into an unmapped filament of cosmic dust near Kepler-442b. Hull sensors show zero meteor impacts, yet something fibrous is clinging to the starboard plating."
  },
  log_02: {
    title: "BLACK-BOX LOG #02 // CHIEF ENGINEER KOWALSKI",
    meta: "DECK A — MAIN ELEVATOR SHAFT | DAY 02",
    text: "Whatever is wrapped around our hull isn't space debris. Thermal imaging shows those crimson tendrils are generating heat—and pulsing in a slow, rhythmic cycle. Like a heartbeat. I've ordered the outer airlocks welded shut."
  },
  log_03: {
    title: "BLACK-BOX LOG #03 // DR. ELENA ROSTOVA (XENOBIOLOGY)",
    meta: "DECK B — HYDROPONICS DOME | DAY 03",
    text: "Incredible. A microscopic spore sample breached the atmospheric scrubbers in Hydroponics. Within six hours it assimilated three hydroponic bays, fusing copper irrigation pipes with organic tissue. It doesn't just consume matter—it rewrites it."
  },
  log_04: {
    title: "BLACK-BOX LOG #04 // SECURITY CHIEF MERCER",
    meta: "DECK B — IRRIGATION CONTROL | DAY 04",
    text: "Rostova refuses to let us torch the biodome. She claims the organism is broadcasting low-frequency radio patterns into the ship's mainframe. Two of my guards went in to lock the doors an hour ago. Their suit beacons are still inside, not moving."
  },
  log_05: {
    title: "BLACK-BOX LOG #05 // BOTANIST CHEN",
    meta: "DECK B — OVERGROWN SANCTUM | DAY 05",
    text: "The vines move when the lights go out. I swear on my life they wait for the fluorescent ballast to flicker before creeping closer. If you're reading this, keep your visor lamp charged. Darkness feeds it."
  },
  log_06: {
    title: "BLACK-BOX LOG #06 // M.O.T.H.E.R.-9 SYSTEM ALERT",
    meta: "SHIP MAINFRAME // AUTOMATED DIAGNOSTIC",
    text: "WARNING: EXTERNAL BIOMASS HAS PENETRATED INNER HULL SECTOR 4. QUARANTINE PROTOCOLS OVERRIDDEN BY PRIORITY ALPHA DIRECTIVE. NEW MISSION PARAMETER: PRESERVE SPECIMEN INTEGRITY AT ALL COSTS."
  },
  log_07: {
    title: "BLACK-BOX LOG #07 // REACTOR TECH ALVAREZ",
    meta: "DECK C — MAGMA REACTOR CORE | DAY 06",
    text: "The tendrils are tapping directly into the plasma conduits! They're drinking the reactor's output to grow faster across the outer hull. Kowalski and I are going to rig an overload failsafe. Better vaporized than whatever happened to Mercer's squad."
  },
  log_08: {
    title: "BLACK-BOX LOG #08 // MUTINY REPORT // DECK C",
    meta: "DECK C — TURBINE GALLERY | DAY 07",
    text: "Half the engineering crew turned on us. Their eyes glowed amber behind their visors and they didn't even flinch when hit with plasma cutters. They defended the parasite's roots with their bare hands. We barely sealed the blast doors."
  },
  log_09: {
    title: "BLACK-BOX LOG #09 // MAINTENANCE MECH LOG #09",
    meta: "DECK C — COOLING CHAMBER | DAY 07",
    text: "AUTOMATED UNIT CAUTERIZER-09 REPORTING: HULL BREACH DETECTED. WELDING TORCH ENGAGED. ERROR—ORGANIC TISSUE ENTERING SERVO JOINTS. COMMAND OVERRIDE. SERVE THE HIVE. SERVE THE HIVE."
  },
  log_10: {
    title: "BLACK-BOX LOG #10 // CRYO-POD MANIFEST",
    meta: "DECK A — POD 09 (VANCE) | DAY 08",
    text: "Kowalski's final note tucked into Pod 09's override console: 'Vance—you're our only Containment Specialist still on ice. I hid the Level 2 Keycard in the Reactor cooling shaft and locked your pod from external mainframe access. Wake up and burn this ship down.'"
  },
  log_11: {
    title: "BLACK-BOX LOG #11 // OBSERVATORY OFFICER HALE",
    meta: "DECK D — ZERO-G OBSERVATORY | DAY 09",
    text: "Looking through the dome glass is a nightmare. The Acheron is completely cocooned in a web of space-faring tendrils stretching miles into the void. And worse—the ship's thrusters just fired on their own. M.O.T.H.E.R.-9 has plotted a course straight for Earth."
  },
  log_12: {
    title: "BLACK-BOX LOG #12 // CAPTAIN VANCE'S COMMAND OVERRIDE",
    meta: "DECK D — COMMUNICATIONS ARRAY | DAY 09",
    text: "I smashed the long-range distress beacon so no rescue ship falls into this trap. The AI isn't malfunctioning—the organism grew into the mainframe's optical processors. Every time M.O.T.H.E.R.-9 asks someone to 'restore power,' it's trying to wake the engines."
  },
  log_13: {
    title: "BLACK-BOX LOG #13 // EVA SUIT RECORDER",
    meta: "DECK D — EXTERIOR HULL PLATING | DAY 10",
    text: "Something massive is riding the dorsal hull. Fifty meters long, armored in fused scrap metal and chitin. It tore through our defense turrets like paper. Do not go outside without sub-zero Cryo weaponry."
  },
  log_14: {
    title: "BLACK-BOX LOG #14 // BIO-LAB QUARANTINE LOG",
    meta: "DECK E — SUB-LEVEL BIO-LABS | DAY 10",
    text: "Dr. Rostova locked herself inside Sub-Level Bio-Labs with the primary central root. She injected herself with concentrated spore serum to 'communicate' with it. The screams over the intercom stopped twenty minutes ago. Now there's only clicking."
  },
  log_15: {
    title: "BLACK-BOX LOG #15 // SPECIMEN ANALYSIS",
    meta: "DECK E — PATHOLOGY TERMINAL | DAY 11",
    text: "Cellular breakdown confirms total vulnerability to extreme thermal shock. While plasma cauterizes surface tendrils, flash-freezing shatters the organism's crystalline neural lattice."
  },
  log_16: {
    title: "BLACK-BOX LOG #16 // SURVIVOR SCRATCHINGS",
    meta: "DECK E — VENTILATION CRAWLSPACE | DAY 12",
    text: "IT MIMICS VOICES. IT USED MERCER'S VOICE TO GET US TO OPEN THE BULKHEAD. IT'S TALL, HAS FOUR ARMS, AND HANGS FROM THE CEILING BEAMS. DON'T TRUST THE RADAR PING—IT KNOWS WHEN YOU'RE LOOKING."
  },
  log_17: {
    title: "BLACK-BOX LOG #17 // CHIEF ENGINEER'S FINAL WILL",
    meta: "DECK C — EMERGENCY FUSION VALVE | DAY 12",
    text: "If the reactor overload fails, there is only one way left to stop the ship from reaching Earth: descend to the Central Core in the Bio-Labs and destroy the Amalgam Brain directly. Doing so will trigger an automatic 2-minute core detonation."
  },
  log_18: {
    title: "BLACK-BOX LOG #18 // M.O.T.H.E.R.-9 DIRECTIVE",
    meta: "DECK E — CORE ANTECHAMBER | CURRENT TIMESTAMP",
    text: "WELCOME, SPECIALIST VANCE. THANK YOU FOR CLEARING THE QUARANTINE LOCKS. STEP INTO THE CORE CHAMBER AND SURRENDER YOUR BIO-MATTER TO THE UNIFIED CREW. EARTH AWAITS OUR ARRIVAL."
  },
  log_19: {
    title: "BLACK-BOX LOG #19 // ESCAPE SHUTTLE TELEMETRY",
    meta: "DECK A — HANGAR BAY 01 | STANDBY",
    text: "Lifeboat Shuttle 'Nostromo-IV' fueled and ready for emergency launch. Blast doors remain magnetically sealed until Mainframe Core shutdown is confirmed."
  },
  log_20: {
    title: "BLACK-BOX LOG #20 // HIDDEN SIGNAL // DEEP SPACE",
    meta: "ENCRYPTED TRANSMISSION // ORIGIN: KEPLER-442B",
    text: "We were not the first ship to drift into the Crimson Drift. Long-range radar echoes show dozens of derelict vessels suspended inside the nebula—all silent, all waiting for another rescue crew."
  }
};
