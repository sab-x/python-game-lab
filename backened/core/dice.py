# backend/core/dice.py
import random
from typing import List

def roll_dice(num_dice: int = 1) -> List[int]:
    """Return list of random ints from 1..6 (num_dice elements)."""
    if num_dice not in (1, 2):
        raise ValueError("Only 1 or 2 dice supported.")
    return [random.randint(1, 6) for _ in range(num_dice)]
