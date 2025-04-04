from flask import Flask, jsonify
from LR0.LR0_Parser import LR0_Parser

app = Flask(__name__)

@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "ok"}), 200

@app.route("/LR0", methods=["POST"])
def LR0_parser():
    TEST_FILE = "test_1.json"
    
    try:
        LR0_parser = LR0_Parser(TEST_FILE)
        result =  LR0_parser.parse()
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(debug=True)