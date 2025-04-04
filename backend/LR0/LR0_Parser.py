import os
from .Grammar import Grammar
from .ItemSet import ItemSet

class LR0_Parser:
    def __init__(self, TEST_FILE):
        self.grammar = None
        self.item_set = None
        self.file_path = os.path.join(os.path.dirname(__file__), "test_files", TEST_FILE)
        self.json_input_file = None

        try:
            with open(self.file_path, "r") as file:
                self.json_input_file = file.read()
        except Exception as e:
            raise Exception(f"Error reading file: {e}")

    def parse(self):
        try:
            self.grammar = Grammar(self.json_input_file)
            parsed_grammar = self.grammar.parse()

            self.item_set = ItemSet(self.grammar)
            parsed_item_set = self.item_set.parse()
            
            return {
                "grammar": parsed_grammar, 
                "item_set": parsed_item_set
                }
        
        except ValueError as e:
            raise Exception(f"Error in parsing: {e}")