import argparse
import sys
import json
import os
import re
from pathlib import Path
import sqlite3
from typing import Optional

def get_user_input(prompt, default=None):
    """Gets user input with an optional default value."""
    if default:
        user_input = input(f"{prompt} (default: {default}): ") or default
    else:
        user_input = input(prompt + ": ")
    return user_input

def get_recursive_depth():
    """Prompts the user for the recursive depth of cataloging."""
    while True:
        try:
            return int(get_user_input("Enter the recursive depth for cataloging", "1"))
        except ValueError:
            print("Invalid input. Please enter an integer.")
def catalog_files(directory: Path, output: Path):
    """Catalogs files in a directory, extracting metadata and basic content info."""
    catalog = []
    output_type = "json file" if str(output).endswith(".json") else "database" if str(output).endswith(".db") else None

    if output_type == "database":
        conn = sqlite3.connect(output)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS files (
                path TEXT PRIMARY KEY,
                name TEXT,
                extension TEXT,
                size INTEGER,
                purpose TEXT,
                concept_id TEXT,
                summary TEXT
            )
        ''')

    for root, _, files in os.walk(directory):
        for filename in files:
            filepath = Path(root) / filename
            try:
                stat = filepath.stat()
                size = stat.st_size
                extension = "".join(filepath.suffixes)
                purpose, concept_id, summary = identify_file_purpose(filepath, extension)

                if output_type == "database":
                    cursor.execute('''
                        INSERT OR REPLACE INTO files (path, name, extension, size, purpose, concept_id, summary)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    ''', (str(filepath.relative_to(directory)), filename, extension, size, purpose, concept_id, summary))
                else:
                    catalog.append({
                        "path": str(filepath.relative_to(directory)),
                        "name": filename,
                        "extension": extension,
                        "size": size,
                        "purpose": purpose,
                        "concept_id": concept_id,
                        "summary": summary,
                    })
            except OSError as e:
                print(f"Error processing '{filepath}': {e}")

    if output_type == "json file":
        with open(output, "w") as f:
            json.dump(catalog, f, indent=2)
    elif output_type == "database":
        conn.commit()
        conn.close()

    print("Cataloging complete.")

def identify_file_purpose(filepath: Path, extension: str) -> tuple[str, Optional[str], Optional[str]]:
  """Attempts to identify the purpose, concept ID, and provides a summary for a given file."""

  purpose = "Unknown"
  concept_id = None
  summary = None
  
  if extension in [".py", ".js", ".c", ".cpp", ".h", ".hpp"]:
    purpose = "Code"
    # Basic keyword-based identification and summary
    try:
        with open(filepath, "r", encoding="utf-8") as f:  # Specify encoding
            content = f.read()

        if "test" in filepath.name or "_test" in filepath.name or "test_" in filepath.name:
            purpose = "Test"
            summary = "Test file"

        elif "api" in filepath.name or ".h" in extension or ".hpp" in extension:
            purpose = "API Definition"
            summary = "API definition file."
        else:  # Heuristic for other code files: look for function/class definitions
            if "def " in content or "class " in content or "function " in content:  # Python/JS/C++
                summary = "Implementation file containing functions or classes."
            else:
                summary = "Code file (purpose not clearly identifiable from content)."

        # Extract a simple concept ID based on filename for now
        concept_id = filepath.stem
    except UnicodeDecodeError:
        summary = "Could not read file due to encoding issues."

  elif extension in [".md", ".txt"]:
      purpose = "Documentation"
      summary = "Documentation file."
  return purpose, concept_id, summary

if __name__ == "__main__":
    print("Welcome to the File Cataloging Tool!")

    default_directory = Path.cwd()
    directory_input = get_user_input("Enter the directory to catalog (or press Enter for current directory)", default_directory)
    directory = Path(directory_input)
    if not directory.exists() or not directory.is_dir():
        print(f"ERROR: Invalid directory '{directory}'. Exiting.", file=sys.stderr)
        sys.exit(1)

    # You can uncomment this if you need recursive file processing within subdirectories
    # recursive_depth = get_recursive_depth()

    output_filename = get_user_input("Enter the output filename (e.g., catalog.json or catalog.db)", "catalog.json")
    output_path = directory / output_filename  # Output within the specified directory

    if output_path.suffix not in [".json", ".db"]:
        print("ERROR: Invalid output file extension. Use .json or .db.", file=sys.stderr)
        sys.exit(1)

    catalog_files(directory, output_path)

    print(f"Catalog saved to: {output_path.resolve()}")
