class First_Follow_Generator:
    def __init__(self, start_symbol, parsed_grammar):
        self.parsed_grammar = parsed_grammar
        self.start_symbol = start_symbol

        self.rules = parsed_grammar['removed_left_factoring']
        self.nonterm_userdef = parsed_grammar['non_terminals']
        self.term_userdef = parsed_grammar['terminals']
        self.diction = parsed_grammar['removed_left_factoring']
        self.firsts = {}
        self.follows = {}

    def first(self, rule):
        if not rule:
            return ['#']

        if rule[0] in self.term_userdef:
            return [rule[0]]
        elif rule[0] == '#':
            return ['#']

        if rule[0] in self.diction:
            fres = []
            for itr in self.diction[rule[0]]:
                indivRes = self.first(itr)
                if indivRes:
                    fres.extend([i for i in indivRes if i not in fres])

            if '#' not in fres:
                return fres
            else:
                fres.remove('#')
                if len(rule) > 1:
                    ansNew = self.first(rule[1:])
                    fres += [i for i in ansNew if i not in fres]
                    return fres
                fres.append('#')
                return fres
        return []

    def follow(self, nt):
        solset = set()
        if nt == self.start_symbol:
            solset.add('$')

        for curNT in self.diction:
            rhs = self.diction[curNT]
            for subrule in rhs:
                if nt in subrule:
                    temp = subrule
                    while nt in temp:
                        index_nt = temp.index(nt)
                        temp = temp[index_nt + 1:]
                        if temp:
                            res = self.first(temp)
                            if res:
                                if '#' in res:
                                    res = [r for r in res if r != '#']
                                    solset.update(res)
                                    if nt != curNT:
                                        solset.update(self.follow(curNT))
                                else:
                                    solset.update(res)
                        else:
                            if nt != curNT:
                                solset.update(self.follow(curNT))
        return list(solset)

    def parse(self):
        # compute FIRST sets
        for nt in self.diction:
            self.firsts[nt] = set()
            for sub in self.diction[nt]:
                res = self.first(sub)
                if res:
                    self.firsts[nt].update(res)

        # compute FOLLOW sets
        for NT in self.diction:
            self.follows[NT] = set(self.follow(NT))

        return {
            "firsts": self.firsts,
            "follows": self.follows
        }