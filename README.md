# Directory Structure Visualization

This repository provides **three different visualizations** of a directory structure, making it easier to explore, understand, and present hierarchical file systems.

---

## Overview

The project works in two main steps:

1. **Extract** the directory structure into a JSON representation
2. **Visualize** this structure using interactive tree-based views in the browser

The visualizations are implemented using standard web technologies and are ready to be extended or adapted to other datasets.

---

## How It Works

### 1. Generate the directory tree

First, you need to "freeze" the structure of a directory into a JSON file. This JSON file will act as the data source for all visualizations.

From the root of the repository, run:

```bash
python data/folder-json.py .
```

This command:

* Recursively scans the target directory
* Converts the folder hierarchy into a structured `.json` file
* Stores the result in the `data/` folder

---

### 2. View the visualizations

Once the JSON file is generated, simply open:

```
src/index.html
```

This page contains **all three directory tree visualizations**.

No server is required — opening the file in a browser is enough.

---

## Project Structure

* `data/`

  * Contains the generated JSON representation of the directory tree
  * Includes the script responsible for converting folders to JSON

* `src/index.html`

  * Entry point for the visualizations

* `src/main.js`

  * Core logic responsible for loading the JSON data and rendering the visualizations

---

## Notes

* Some folders and files included in the repository are **placeholders**.

  * They exist only to make the visualizations more realistic
  * They do not contain functional code

* The core logic of the project lives in:

  * `data/`
  * `src/index.html`
  * `src/main.js`
