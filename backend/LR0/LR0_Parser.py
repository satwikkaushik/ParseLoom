import os
from .Grammar import Grammar
from .ItemSet import ItemSet

class LR0_Parser:
    def __init__(self, input_grammar):
        self.grammar = None
        self.item_set = None
        self.json_input_file = None
        self.input_grammar = input_grammar

    def parse(self):
        try:
            self.grammar = Grammar(self.input_grammar)
            parsed_grammar = self.grammar.parse()

            self.item_set = ItemSet(self.grammar)
            parsed_item_set = self.item_set.parse()
            
            return {
                "grammar": parsed_grammar, 
                "item_set": parsed_item_set
                }
        
        except ValueError as e:
            raise Exception(f"Error in parsing: {e}")