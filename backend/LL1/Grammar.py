class Grammar:
    def __init__(self, data):
        self.data = data
        self.terminals = set()
        self.non_terminals = set()
        self.diction = {}
        self.removed_left_recursion = []
        self.removed_left_factoring = []

    def extract_grammar_components(self):
        nonterm_userdef = list(self.data.keys())
        term_userdef = []

        for rhs_str in self.data.values():
            for part in rhs_str.split('|'):
                for symbol in part.strip().split():
                    if symbol not in nonterm_userdef and symbol != '#' and symbol not in term_userdef:
                        term_userdef.append(symbol)

        if '#' not in term_userdef:
            term_userdef.append('#')

        self.non_terminals = set(nonterm_userdef)
        self.terminals = set(term_userdef)

    def prepare_grammar_dict(self):
        diction = {}
        for lhs, rhs_str in self.data.items():
            rhs_alternatives = [alt.strip().split() for alt in rhs_str.split('|')]
            diction[lhs.strip()] = rhs_alternatives
        
        self.diction = diction

    def removeLeftRecursion(self):
        rulesDiction = self.diction.copy()
        store = {}
        for lhs in list(rulesDiction.keys()):
            alphaRules = []
            betaRules = []
            allrhs = rulesDiction[lhs]
            for subrhs in allrhs:
                if subrhs and subrhs[0] == lhs:
                    alphaRules.append(subrhs[1:])
                else:
                    betaRules.append(subrhs)
            if len(alphaRules) != 0:
                lhs_ = lhs + "'"
                while (lhs_ in rulesDiction.keys()) or (lhs_ in store.keys()):
                    lhs_ += "'"
                for b in range(0, len(betaRules)):
                    betaRules[b].append(lhs_)
                rulesDiction[lhs] = betaRules
                for a in range(0, len(alphaRules)):
                    alphaRules[a].append(lhs_)
                alphaRules.append(['#'])
                store[lhs_] = alphaRules
        for left in store:
            rulesDiction[left] = store[left]

        self.removed_left_recursion = rulesDiction

    def removeLeftFactoring(self):
        newDict = {}
        rulesDiction = self.removed_left_recursion.copy()

        for lhs in rulesDiction:
            allrhs = rulesDiction[lhs]
            temp = dict()
            for subrhs in allrhs:
                if not subrhs:
                    if '#' not in temp:
                        temp['#'] = [['#']]
                    continue
                if subrhs[0] not in temp:
                    temp[subrhs[0]] = [subrhs]
                else:
                    temp[subrhs[0]].append(subrhs)
            new_rule = []
            tempo_dict = {}
            for term_key in temp:
                allStartingWithTermKey = temp[term_key]
                if len(allStartingWithTermKey) > 1:
                    lhs_ = lhs + "'"
                    while (lhs_ in rulesDiction.keys()) or (lhs_ in tempo_dict.keys()):
                        lhs_ += "'"
                    new_rule.append([term_key, lhs_])
                    ex_rules = []
                    for g in temp[term_key]:
                        if len(g) > 1:
                            ex_rules.append(g[1:])
                        else:
                            ex_rules.append(['#'])
                    tempo_dict[lhs_] = ex_rules
                else:
                    new_rule.append(allStartingWithTermKey[0])
            newDict[lhs] = new_rule
            for key in tempo_dict:
                newDict[key] = tempo_dict[key]
        
        self.removed_left_factoring = newDict

    def parse(self):
        self.extract_grammar_components()
        self.prepare_grammar_dict()
        self.removeLeftRecursion()
        self.removeLeftFactoring()

        return {
            "terminals": list(self.terminals),
            "non_terminals": list(self.non_terminals),
            "grammar": self.data,
            "diction": self.diction,
            "removed_left_recursion": self.removed_left_recursion,
            "removed_left_factoring": self.removed_left_factoring
        }