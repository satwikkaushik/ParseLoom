import copy

class Input_Parser:
    def __init__(self, parsed_grammar, first_follow_result):
        self.parsed_grammar = parsed_grammar
        self.first_follow_result = first_follow_result
        self.start_symbol = list(parsed_grammar["removed_left_factoring"].keys())[0]
        self.terminals = list(parsed_grammar['terminals'])
        self.non_terminals = list(parsed_grammar['removed_left_factoring'].keys())
        self.parsing_table, self.table_terminals, self.table_non_terminals = self._build_parsing_table()

    def _first_of_rule(self, rule, firsts):
        if not rule:
            return set(['#'])
        if rule[0] in self.terminals:
            return set([rule[0]])
        elif rule[0] == '#':
            return set(['#'])
        elif rule[0] in firsts:
            fres = set(firsts[rule[0]])
            if '#' in fres:
                fres.remove('#')
                if len(rule) > 1:
                    fres |= self._first_of_rule(rule[1:], firsts)
                else:
                    fres.add('#')
            return fres
        return set()

    def _build_parsing_table(self):
        diction = self.parsed_grammar['removed_left_factoring']
        firsts = self.first_follow_result['firsts']
        follows = self.first_follow_result['follows']
        term_userdef = list(self.parsed_grammar['terminals'])
        ntlist = list(diction.keys())
        terminals = copy.deepcopy(term_userdef)
        if '$' not in terminals:
            terminals.append('$')
        mat = [['' for _ in terminals] for _ in ntlist]
        for lhs in diction:
            for y in diction[lhs]:
                res = list(self._first_of_rule(y, firsts))
                if not res:
                    continue
                if '#' in res:
                    res.remove('#')
                    res += list(follows[lhs])
                for c in res:
                    if c in terminals:
                        xnt = ntlist.index(lhs)
                        yt = terminals.index(c)
                        new_entry = f"{lhs}->" + ' '.join(y)
                        if mat[xnt][yt] == '':
                            mat[xnt][yt] = new_entry
                        elif mat[xnt][yt] != new_entry:
                            mat[xnt][yt] += ',' + new_entry
        return mat, terminals, ntlist

    def parse_input(self, input_string):
        # Accepts either a string or a list of tokens
        if isinstance(input_string, list):
            tokens = input_string + ['$']
        else:
            tokens = input_string.strip().split() + ['$']
        stack = [self.start_symbol, '$']
        pointer = 0
        steps = []
        while stack:
            top = stack[0]
            current_token = tokens[pointer]
            steps.append((list(stack), tokens[pointer:]))
            if top == current_token == '$':
                return True, steps
            elif top == current_token:
                stack.pop(0)
                pointer += 1
            elif top in self.table_non_terminals:
                nt_index = self.table_non_terminals.index(top)
                t_index = self.table_terminals.index(current_token) if current_token in self.table_terminals else -1
                if t_index == -1 or self.parsing_table[nt_index][t_index] == '':
                    return False, steps
                production = self.parsing_table[nt_index][t_index]
                rhs = production.split('->')[1].strip()
                stack.pop(0)
                if rhs != '#':
                    rhs_symbols = rhs.split()[::-1]
                    for sym in rhs_symbols:
                        stack.insert(0, sym)
            else:
                return False, steps
        return False, steps