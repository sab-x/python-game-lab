import json
import os
import threading
from typing import Dict, Any

DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "state.json")
_SAVE_LOCK = threading.Lock()

# Default state (including history!!)
DEFAULT_STATE = {
    "mode": "solo",
    "dice_count": 1,
    "total_rolls": 0,
    "highest_score": 0,
    "highest_player": "None",
    "player1_score": 0,
    "player2_score": 0,
    "game_over": False,
    "message": "Welcome to Dice Roller!",
    "history": []  # <<< FIXED: ADDED HISTORY LIST
}

def _ensure():
    """Ensures directory and state.json exist."""
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)

    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, "w") as f:
            json.dump(DEFAULT_STATE, f, indent=2)


def load() -> Dict[str, Any]:
    """Loads state.json and ensures all fields exist."""
    _ensure()
    try:
        with open(DATA_FILE, "r") as f:
            data = json.load(f)
    except Exception:
        # If corrupted, recreate file
        save(DEFAULT_STATE)
        return DEFAULT_STATE.copy()

    # Ensure all keys exist
    for key, value in DEFAULT_STATE.items():
        if key not in data:
            data[key] = value

    # Ensure history is always a list
    if not isinstance(data.get("history"), list):
        data["history"] = []

    return data


def save(state: Dict[str, Any]) -> None:
    """Atomic save to prevent corruption."""
    _ensure()
    tmp = DATA_FILE + ".tmp"

    with _SAVE_LOCK:
        try:
            with open(tmp, "w") as f:
                json.dump(state, f, indent=2)
            os.replace(tmp, DATA_FILE)
        except Exception as e:
            print("Save failed:", e)
            try:
                if os.path.exists(tmp):
                    os.remove(tmp)
            except:
                pass
