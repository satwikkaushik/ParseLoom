class InputParser:
    def __init__(self, item_sets, goto_table, input_string):
        self.item_sets = item_sets
        self.goto_table = goto_table
        self.input_string = input_string
        self.parsing_table = []
        self.action_table = {}
        self.goto_map = {}
        self.stack = []
        self.input_buffer = []
        self.parse_steps = []
        
    def create_action_and_goto_tables(self):
        for state_idx, state in enumerate(self.item_sets):
            # empty actions for current state
            if state_idx not in self.action_table:
                self.action_table[state_idx] = {}
            
            shift_actions = {}
            reduce_actions = {}
            
            for item in state:
                lhs, rhs, dot_pos = item
                
                # reduce action
                if dot_pos == len(rhs):
                    # accepting state
                    if lhs.endswith("'") and dot_pos == 1 and rhs[0] == lhs[:-1]:
                        self.action_table[state_idx]['$'] = ('accept', '')
                    else:
                        # reduce action
                        for terminal in self.get_terminals():
                            if terminal not in reduce_actions:
                                reduce_actions[terminal] = []
                            rhs_list = list(rhs)
                            reduce_actions[terminal].append((lhs, rhs_list))
                
                # shift action
                elif dot_pos < len(rhs) and rhs[dot_pos] not in self.get_non_terminals():
                    symbol = rhs[dot_pos]
                    
                    # check if transition for this symbol
                    key = f"{state_idx},{symbol}"
                    if key in self.goto_table:
                        next_state = self.goto_table[key]
                        shift_actions[symbol] = next_state
            
            for symbol, actions in reduce_actions.items():
                if symbol in shift_actions:
                    # shift-reduce conflict - favor shift action
                    self.action_table[state_idx][symbol] = ('shift', shift_actions[symbol])
                elif actions:
                    # No conflict, use first reduce action
                    # check for reduce-reduce conflicts
                    self.action_table[state_idx][symbol] = ('reduce', actions[0])
            
            # shift actions
            for symbol, next_state in shift_actions.items():
                if symbol not in self.action_table[state_idx]:
                    self.action_table[state_idx][symbol] = ('shift', next_state)
        
        # construct goto map
        for key, value in self.goto_table.items():
            state, symbol = key.split(',')
            state = int(state)
            if symbol in self.get_non_terminals():
                if state not in self.goto_map:
                    self.goto_map[state] = {}
                self.goto_map[state][symbol] = value

    def get_terminals(self):
        terminals = set()
        for state in self.item_sets:
            for item in state:
                lhs, rhs, dot_pos = item
                for symbol in rhs:
                    if symbol not in self.get_non_terminals() and symbol != 'ε':
                        terminals.add(symbol)
        terminals.add('$')
        return terminals
    
    def get_non_terminals(self):
        non_terminals = set()
        for state in self.item_sets:
            for item in state:
                lhs, rhs, dot_pos = item
                non_terminals.add(lhs)
                # exclude augmented productions
                if lhs.endswith("'"):
                    non_terminals.add(lhs[:-1])
        return non_terminals
    
    def parse_input(self):
        self.stack = [0]
        self.input_buffer = list(self.input_string) + ['$']
        
        step_count = 0
        while True:
            current_state = self.stack[-1]
            current_symbol = self.input_buffer[0] if self.input_buffer else '$'
            
            # current step
            step = {
                'step': step_count,
                'stack': list(self.stack),
                'input': list(self.input_buffer),
                'action': ''
            }
            
            if current_symbol in self.action_table.get(current_state, {}):
                action_type, action_value = self.action_table[current_state][current_symbol]
                
                if action_type == 'shift':
                    step['action'] = f"Shift {action_value}"
                    self.parse_steps.append(step)
                    
                    # shift
                    symbol = self.input_buffer.pop(0)
                    self.stack.append(symbol)
                    self.stack.append(action_value)
                    
                elif action_type == 'reduce':
                    # reduce
                    reduce_lhs, reduce_rhs = action_value
                    
                    production_str = f"{reduce_lhs} -> {' '.join(reduce_rhs)}"
                    step['action'] = f"Reduce by {production_str}"
                    self.parse_steps.append(step)
                    
                    # pop
                    symbols_to_remove = 2 * len(reduce_rhs)
                    if 'ε' in reduce_rhs:  # Handle epsilon productions
                        symbols_to_remove = 0
                    
                    for _ in range(symbols_to_remove):
                        self.stack.pop()
                    
                    top_state = self.stack[-1]
                    
                    # push
                    self.stack.append(reduce_lhs)
                    
                    # push
                    if top_state in self.goto_map and reduce_lhs in self.goto_map[top_state]:
                        goto_state = self.goto_map[top_state][reduce_lhs]
                        self.stack.append(goto_state)
                    else:
                        return {
                            'success': False,
                            'error': f"No goto defined for state {top_state} and non-terminal {reduce_lhs}",
                            'steps': self.parse_steps
                        }
                
                elif action_type == 'accept':
                    # accept
                    step['action'] = "Accept"
                    self.parse_steps.append(step)
                    
                    return {
                        'success': True,
                        'steps': self.parse_steps
                    }
            else:
                # no action found
                step['action'] = "Error"
                self.parse_steps.append(step)
                
                return {
                    'success': False,
                    'error': f"No action defined for state {current_state} and symbol {current_symbol}",
                    'steps': self.parse_steps
                }
            
            step_count += 1
            
            # prevent infinite loops
            if step_count > 1000:
                return {
                    'success': False,
                    'error': "Parsing took too many steps, possible infinite loop",
                    'steps': self.parse_steps
                }
    
    def parse(self):
        try:
            self.create_action_and_goto_tables()
            parse_result = self.parse_input()
            
            serialized_action_table = {}
            for state, actions in self.action_table.items():
                serialized_action_table[state] = {}
                for symbol, (action_type, action_value) in actions.items():
                    if action_type == 'reduce':
                        lhs, rhs = action_value
                        serialized_action_table[state][symbol] = {
                            'type': action_type,
                            'production': {
                                'lhs': lhs,
                                'rhs': rhs
                            }
                        }
                    else:
                        serialized_action_table[state][symbol] = {
                            'type': action_type,
                            'value': action_value
                        }
            
            return {
                'action_table': serialized_action_table,
                'goto_table': self.goto_map,
                'parsing_steps': parse_result['steps'],
                'success': parse_result['success'],
                'error': parse_result.get('error', None)
            }
            
        except Exception as e:
            raise Exception(f"Error in parsing input: {e}")