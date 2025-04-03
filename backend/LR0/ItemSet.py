class ItemSet:
    def __init__(self, grammar):
        self.grammar = grammar
        self.start_symbol = grammar.start_symbol
        self.augmented_start_symbol = self.start_symbol + "'"
        self.states = []
        self.transitions = {}

    def augment_grammar(self):
        self.grammar.productions[self.augmented_start_symbol] = [(self.start_symbol,)]
        self.grammar.non_terminals.add(self.augmented_start_symbol)

    def closure(self, items):
        closure_set = set(items)
        added = True
        
        while added:
            added = False
            new_items = set(closure_set)  #copy of current set to avoid modification during iteration

            for lhs, rhs, dot_pos in closure_set:
                if dot_pos < len(rhs):  #checking if dot is at the end
                    next_symbol = rhs[dot_pos]

                    if next_symbol in self.grammar.non_terminals:
                        for production in self.grammar.productions[next_symbol]:
                            new_item = (next_symbol, tuple(production), 0)
                            
                            if new_item not in new_items:
                                new_items.add(new_item)
                                added = True
                                
            closure_set = new_items  #adding in closure_set only after all new items are found

        return closure_set

    def goto(self, state, symbol):
        next_items = set()

        for lhs, rhs, dot_pos in state:
            if dot_pos < len(rhs) and rhs[dot_pos] == symbol:
                next_items.add((lhs, tuple(rhs), dot_pos + 1))

        return self.closure(next_items) if next_items else None

    def construct_item_sets(self):
        self.augment_grammar()
        start_item = (self.augmented_start_symbol, (self.start_symbol,), 0)
        start_state = self.closure({start_item})

        self.states = [start_state]
        state_map = {frozenset(start_state): 0}

        queue = [start_state]
        while queue:
            state = queue.pop(0)
            state_index = state_map[frozenset(state)]

            for symbol in self.grammar.non_terminals | self.grammar.terminals:
                next_state = self.goto(state, symbol)
                
                if next_state and frozenset(next_state) not in state_map:
                    state_map[frozenset(next_state)] = len(self.states)
                    self.states.append(next_state)
                    queue.append(next_state)

                if next_state:
                    self.transitions[(state_index, symbol)] = state_map[frozenset(next_state)]

    def display_item_sets(self):
        print("\nConstructed Item Sets:")
        
        for i, state in enumerate(self.states):
            print(f"\nI{i}:")
            
            for lhs, rhs, dot_pos in state:
                production = " ".join(rhs[:dot_pos] + ("•",) + rhs[dot_pos:])
                print(f"  {lhs} → {production}")

    def display_goto_table(self):
        print("\nGOTO Table:")

        for (state, symbol), next_state in self.transitions.items():
            print(f"  GOTO(I{state}, {symbol}) = I{next_state}")
