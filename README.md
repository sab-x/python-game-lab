
# 🎲 Dice Roller Game – Backend (Flask)
This is the backend API for the Dice Roller Game.  
It provides REST endpoints for rolling dice, tracking game state, and resetting the game.


## ✅ Features
- Roll 1 or 2 dice
- Supports Solo, Vs Computer, and 2-Player modes
- Stores state in JSON (no database needed)
- Simple Flask server


## 🧩 Project Structure

backend/
│
├── core/
│   └── dice.py
│
├── utils/
│   └── storage.py
│
├── data/
│   └── state.json
│
├── tests/
│   └── test_dice.py
│
├── main.py
├── requirements.txt
└── README.md

