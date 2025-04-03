from Grammar import Grammar
from ItemSet import ItemSet

def main():
    test_file = "test_4"
    with open(f"./test_files/{test_file}.json", "r") as file:
        json_input_file = file.read()

    grammar = Grammar()
    try:
        grammar.parse(json_input_file)
    except ValueError as e:
        print(f"Error parsing grammar: {e}")
        return
    
    print("Parsed Grammar:")
    grammar.display()

    item_set = ItemSet(grammar)
    try:
        item_set.construct_item_sets()
        item_set.display_item_sets()
        item_set.display_goto_table()
    except Exception as e:
        print(f"Error constructing item sets: {e}")
        return
    
if __name__ == "__main__":
    main()