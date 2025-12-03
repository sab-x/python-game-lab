from flask import Flask, jsonify, request, render_template
import random

app = Flask(__name__, static_folder="../frontend/static", template_folder="../frontend/templates")

# --- GLOBAL GAME STATE ---
game_state = {
    "mode": "solo",
    "dice_count": 1,
    "total_rolls": 0,
    "highest_sum": 0,
    "player1_score": 0,
    "player2_score": 0,
    "rounds": 0
}

# --- UTILITY ---
def roll_dice_once(count):
    dice = [random.randint(1, 6) for _ in range(count)]
    total = sum(dice)
    return dice, total


# --- ROUTES ---

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/roll", methods=["POST"])
def roll_dice():
    global game_state
    data = request.get_json()
    mode = data.get("mode", "solo")
    dice_count = int(data.get("number_of_dice", 1))
    player = data.get("player")

    event = {"desc": ""}
    stats = {}

    # SOLO MODE
    if mode == "solo":
        dice, total = roll_dice_once(dice_count)
        game_state["total_rolls"] += 1
        if total > game_state["highest_sum"]:
            game_state["highest_sum"] = total

        event["player"] = {"dice": dice, "sum": total}
        event["desc"] = f"Solo rolled {dice} = {total}"

        stats = {
            "total_actions": game_state["total_rolls"],
            "highest_sum": game_state["highest_sum"]
        }

    # VS COMPUTER MODE
    elif mode == "vs_computer":

        # MAX 5 ROUNDS – STOP GAME
        if game_state["rounds"] >= 5:
            winner = "tie"
            if game_state["player1_score"] > game_state["player2_score"]:
                winner = "you"
            elif game_state["player2_score"] > game_state["player1_score"]:
                winner = "computer"

            return jsonify({
                "event": {
                    "desc": f"🏁 GAME OVER — Final Winner: {winner.upper()}",
                    "winner": winner
                },
                "stats": game_state
            })

        dice_p1, total_p1 = roll_dice_once(dice_count)
        dice_cpu, total_cpu = roll_dice_once(dice_count)

        game_state["total_rolls"] += 1
        game_state["rounds"] += 1

        if total_p1 > game_state["highest_sum"]:
            game_state["highest_sum"] = total_p1
        if total_cpu > game_state["highest_sum"]:
            game_state["highest_sum"] = total_cpu

        winner = "tie"
        if total_p1 > total_cpu:
            winner = "you"
            game_state["player1_score"] += 1
        elif total_cpu > total_p1:
            winner = "computer"
            game_state["player2_score"] += 1

        event = {
            "player": {"dice": dice_p1, "sum": total_p1},
            "opponent": {"dice": dice_cpu, "sum": total_cpu},
            "winner": winner,
            "desc": f"You rolled {dice_p1}={total_p1} | Computer rolled {dice_cpu}={total_cpu}"
        }

        stats = {
            "total_actions": game_state["total_rolls"],
            "highest_sum": game_state["highest_sum"],
            "playerScores": {
                "1": game_state["player1_score"],
                "2": game_state["player2_score"]
            },
            "playerRounds": {
                "1": game_state["rounds"],
                "2": game_state["rounds"]
            },
            "rounds": game_state["rounds"]
        }

    # TWO PLAYER MODE
    elif mode == "two_player":

        #  STOP AFTER 5 ROUNDS
        if game_state["rounds"] >= 5:
            winner = "tie"
            if game_state["player1_score"] > game_state["player2_score"]:
                winner = "Player 1"
            elif game_state["player2_score"] > game_state["player1_score"]:
                winner = "Player 2"

            return jsonify({
                "event": {
                    "desc": f"🏁 GAME OVER — Final Winner: {winner.upper()}",
                    "winner": winner
                },
                "stats": game_state
            })

        dice, total = roll_dice_once(dice_count)
        game_state["total_rolls"] += 1
        game_state["rounds"] += 1

        if total > game_state["highest_sum"]:
            game_state["highest_sum"] = total

        if player == 1:
            game_state["player1_score"] += total
        elif player == 2:
            game_state["player2_score"] += total

        event["player"] = {"dice": dice, "sum": total}
        event["desc"] = f"P{player} rolled {dice} = {total}"

        stats = {
            "total_actions": game_state["total_rolls"],
            "highest_sum": game_state["highest_sum"],
            "playerScores": {
                "1": game_state["player1_score"],
                "2": game_state["player2_score"]
            },
            "rounds": game_state["rounds"]
        }

    return jsonify({"event": event, "stats": stats})


@app.route("/api/state")
def get_state():
    return jsonify(game_state)


@app.route("/api/reset", methods=["POST"])
def reset_game():
    global game_state
    game_state = {
        "mode": "solo",
        "dice_count": 1,
        "total_rolls": 0,
        "highest_sum": 0,
        "player1_score": 0,
        "player2_score": 0,
        "rounds": 0
    }
    return jsonify(game_state)


if __name__ == "__main__":
    app.run(debug=True)
