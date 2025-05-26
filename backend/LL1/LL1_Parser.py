import json
from .Grammar import Grammar
from .First_Follow_Generator import First_Follow_Generator

class LL1_Parser:
    def __init__(self):
        self.parsed_grammar = None
        self.start_symbol = None
        self.first_follow_result = None

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

            self.start_symbol = list(self.parsed_grammar["removed_left_factoring"].keys())[0]

            first_follow_generator = First_Follow_Generator(self.start_symbol, self.parsed_grammar)
            self.first_follow_result = first_follow_generator.parse()

            return {
                "parsed_grammar": self.parsed_grammar,
                "first_follow: ": self.first_follow_result,
            }
        else:
            print("Failed to load grammar from the specified file.")