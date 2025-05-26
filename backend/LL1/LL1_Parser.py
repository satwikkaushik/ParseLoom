import json
from .Grammar import Grammar
from .First_Follow_Generator import First_Follow_Generator
from .Input_Parser import Input_Parser

class LL1_Parser:
    def __init__(self, input_grammar, input_string):
        self.input_grammar = input_grammar
        self.input_string = input_string

        self.parsed_grammar = None
        self.start_symbol = None
        self.first_follow_result = None
        self.input_parser = None

    def _convert_sets_to_lists(self, obj):
        if isinstance(obj, dict):
            return {k: self._convert_sets_to_lists(v) for k, v in obj.items()}
        elif isinstance(obj, set):
            return list(obj)
        elif isinstance(obj, list):
            return [self._convert_sets_to_lists(i) for i in obj]
        else:
            return obj

    def parse(self):
        # data = self.load_rules_from_json(test_file_name)

        grammar = Grammar(self.input_grammar)
        self.parsed_grammar = grammar.parse()

        self.start_symbol = list(self.parsed_grammar["removed_left_factoring"].keys())[0]

        first_follow_generator = First_Follow_Generator(self.start_symbol, self.parsed_grammar)
        self.first_follow_result = first_follow_generator.parse()

        # Initialize Input_Parser with grammar and first/follow
        self.input_parser = Input_Parser(self.parsed_grammar, self.first_follow_result)

        parsing_result = self.parse_input(self.input_string)

        # Convert sets to lists for JSON serialization
        grammar_json = self._convert_sets_to_lists(self.parsed_grammar)
        first_follow_json = self._convert_sets_to_lists(self.first_follow_result)
        parsing_steps_json = self._convert_sets_to_lists(parsing_result["steps"])
        result_json = self._convert_sets_to_lists(parsing_result["accepted"])
        
        return {
            "grammar": grammar_json,
            "first_follow: ": first_follow_json,
            "parsing_steps": parsing_steps_json,
            "result": result_json,
        }

    def parse_input(self, input_string):
        if self.input_parser is None:
            print("Error: Grammar and parsing table not initialized. Call parse() first.")
            return None
        accepted, steps = self.input_parser.parse_input(input_string)
        return {"accepted": accepted, "steps": steps}