import json

class Grammar:
    def __init__(self, json_input_file):
        self.terminals = set()
        self.non_terminals = set()
        self.productions = {}
        self.start_symbol = None
        self.json_input_file = json_input_file

    def parse(self):
        try:
            data = json.loads(self.json_input_file) if isinstance(self.json_input_file, str) else self.json_input_file
        except json.JSONDecodeError:
            raise Exception("Invalid JSON input")

        if not data:
            raise Exception("Empty JSON input")
        
        # extracting non-terminals(keys)
        self.non_terminals = set(data.keys())
        self.start_symbol = list(data.keys())[0]

        for lhs, rhs in data.items():
            rhs = rhs.strip()

            if not rhs:
                raise Exception(f"Empty production for non-terminal '{lhs}'")
            
            self.productions[lhs] = []
            alternatives = [alt.strip() for alt in rhs.split('|')]

            for alt in alternatives:
                # handling epsilon production
                if alt in {'ε', 'epsilon', '$', ''}:
                    self.productions[lhs].append([])
                else:
                    symbols = alt.split()
                    self.productions[lhs].append(symbols)

        for lhs, rhs_list in self.productions.items():
            for production in rhs_list:
                for symbol in production:
                    if symbol not in self.non_terminals:
                        self.terminals.add(symbol)

        return {
            "start_symbol": self.start_symbol,
            "non_terminals": list(self.non_terminals),
            "terminals": list(self.terminals),
            "productions": self.productions
        }