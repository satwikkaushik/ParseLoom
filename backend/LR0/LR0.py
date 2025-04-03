from Grammar import Grammar

def main():
    test_file = "test_3"
    with open(f"./test_files/{test_file}.json", "r") as file:
        json_input_file = file.read()

    grammar = Grammar()
    try:
        grammar.parse(json_input_file)
    except ValueError as e:
        print(f"Error parsing grammar: {e}")
        return
    
    grammar.display()

if __name__ == "__main__":
    main()