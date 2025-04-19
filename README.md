# ParseLoom
ParseLoom is a web-based tool for visualizing and understanding parser generation and parsing processes, focusing on LR(0) parsers.

## Overview
ParseLoom provides an interactive interface for:

- Inputting and validating context-free grammars
- Visualizing the LR(0) item sets generated from the grammar
- Generating and displaying parsing tables
- Simulating the parsing process for input strings
- The project consists of a Flask backend for handling the  parsing logic and a responsive frontend interface for visualization.

## Features
**Grammar Input**: Enter grammar productions in a simple format
**Input String Testing**: Test parsing on custom input strings
**LR(0) Item Set Visualization**: Visual representation of LR(0) item sets
**Parse Table Generation**: Automatic construction of LR(0) parsing tables
**Step-by-Step Parsing**: Observe the parsing process step by step
**Error Handling**: Clear feedback for invalid grammars or strings

## Architecture
<img  src="ParseLoom_architecture.png">

## Usage 
1. Start the Flask backend:
```
cd backend
python app.py
```

2. Open the frontend in a web browser (either by serving the files or opening index.html directly)

3. Input a grammar in the format:
```
S -> ( S ) | id
```

4. Enter a test string using space-separated tokens:
```
( id )
```

5. Click "Parse" to generate visualizations

