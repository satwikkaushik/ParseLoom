from flask import Flask, jsonify, request
from LR0.LR0_Parser import LR0_Parser
from LL1.LL1_Parser import LL1_Parser
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "ok"}), 200

@app.route("/LR0", methods=["POST"])
def LR0_parser():
    input_data = request.get_json()
    input_grammar = input_data.get("grammar")
    input_string = input_data.get("string").split(" ")
    
    try:
        LR0_parser = LR0_Parser(input_grammar, input_string)
        result = LR0_parser.parse()
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/LL1", methods=["POST"])
def LL1_parser():
    input_data = request.get_json()
    input_grammar = input_data.get("grammar")
    input_string = input_data.get("string").split(" ")
    
    try:
        LL1_parser = LL1_Parser(input_grammar, input_string)
        result = LL1_parser.parse()
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(debug=True, port=5000)