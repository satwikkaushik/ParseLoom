import json

class Grammar:
    def __init__(self):
        self.terminals = set()
        self.non_terminals = set()
        self.productions = {}
        self.start_symbol = None

    def parse(self, json_input_file):
        try:
            data = json.loads(json_input_file) if isinstance(json_input_file, str) else json_input_file
        except json.JSONDecodeError:
            raise ValueError("Invalid JSON input")

        if not data:
            raise ValueError("Empty JSON input")
        
        # extracting non-terminals(keys)
        self.non_terminals = set(data.keys())
        self.start_symbol = list(data.keys())[0]

        for lhs, rhs in data.items():
            rhs = rhs.strip()

            if not rhs:
                raise ValueError(f"Empty production for non-terminal '{lhs}'")
            
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

    def display(self):
        print("Start Symbol:", self.start_symbol)
        print("Non-Terminals:", self.non_terminals)
        print("Terminals:", self.terminals)
        print("Productions:")
        for lhs, rhs_list in self.productions.items():
            rhs_str = " | ".join([" ".join(rhs) if rhs else "ε" for rhs in rhs_list])
            print(f"  {lhs} -> {rhs_str}")