import json
from .Grammar import Grammar

class LL1_Parser:
    def __init__(self):
        self.parsed_grammar = None

    # remove this later
    def load_rules_from_json(self, filename):
        try:
            with open(filename, 'r') as file:
                data = json.load(file)

            if not isinstance(data, dict):
                raise ValueError("JSON must be a dictionary where keys are non-terminals and values are production strings.")

            for key, value in data.items():
                if not isinstance(value, str):
                    raise ValueError(f"Invalid production for {key}: must be a string.")

            return data
        except FileNotFoundError:
            print(f"Error: File '{filename}' not found.")
            return None
        except json.JSONDecodeError as e:
            print(f"Error: Invalid JSON format in '{filename}': {e}")
            return None
        except Exception as e:
            print(f"Error loading JSON file: {str(e)}")
            return None

    def parse(self, test_file_name):
        data = self.load_rules_from_json(test_file_name)

        if data:
            grammar = Grammar(data)
            self.parsed_grammar = grammar.parse()

            return self.parsed_grammar
        else:
            print("Failed to load grammar from the specified file.")