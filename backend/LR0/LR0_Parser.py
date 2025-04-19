import os
from .Grammar import Grammar
from .ItemSet import ItemSet
from .InputParser import InputParser

class LR0_Parser:
    def __init__(self, input_grammar, input_string):
        self.grammar = None
        self.item_set = None
        self.input_parser = None

        self.input_grammar = input_grammar
        self.input_string = input_string

    def parse(self):
        try:
            self.grammar = Grammar(self.input_grammar)
            parsed_grammar = self.grammar.parse()

            self.item_set = ItemSet(self.grammar)
            parsed_item_set = self.item_set.parse()

            self.input_parser = InputParser(parsed_item_set["item_sets"], parsed_item_set["goto_table"], self.input_string)
            parsed_table = self.input_parser.parse()
            
            return {
                "grammar": parsed_grammar,
                "item_set": parsed_item_set,
                "parsed_table": parsed_table
                }
        
        except ValueError as e:
            print(f"ValueError: {e}")
            raise Exception(f"Error in parsing: {e}")