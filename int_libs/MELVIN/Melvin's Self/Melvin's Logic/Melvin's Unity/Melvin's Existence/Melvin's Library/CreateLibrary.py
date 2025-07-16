# melvin.py
# A script to build the shelves of our great library.
# It reads all Dewey concept JSON files and creates a corresponding
# named folder for each conceptual category.

import os
import json
import re

# --- Configuration ---
# The directory containing the Dewey .json files.
# Assumes the script is run from a parent directory.
DEWEY_CONCEPTS_DIR = 'CardCat'

# The name of the main library folder to be created.
LIBRARY_NAME = "Shelves by subject"

def sanitize_folder_name(name):
    """
    Removes characters that are illegal in Windows folder names.
    """
    return re.sub(r'[\\/*?:"<>|]', "", name)

def build_library_shelves():
    """
    Reads Dewey JSON files, extracts information, and creates a
    directory structure based on that information.
    """
    if not os.path.isdir(DEWEY_CONCEPTS_DIR):
        print(f"Error: Source directory '{DEWEY_CONCEPTS_DIR}' not found.")
        print(f"Please place this script in a location where '{DEWEY_CONCEPTS_DIR}' is a sub-directory.")
        return

    # Create the main library folder if it doesn't exist
    if not os.path.exists(LIBRARY_NAME):
        print(f"Creating the main directory: '{LIBRARY_NAME}'")
        os.makedirs(LIBRARY_NAME)

    print(f"\nReading concept files from '{DEWEY_CONCEPTS_DIR}' to build shelves in '{LIBRARY_NAME}'...")

    folders_created = 0
    files_skipped = 0

    # Iterate over every file in the source directory
    for filename in os.listdir(DEWEY_CONCEPTS_DIR):
        if filename.endswith('.json'):
            filepath = os.path.join(DEWEY_CONCEPTS_DIR, filename)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                # Safely get the required fields using .get() to avoid errors
                notation = data.get('notation')
                pref_label_obj = data.get('prefLabel', {})
                pref_label_en = pref_label_obj.get('en')

                # Proceed only if both required fields are found
                if notation and pref_label_en:
                    # Format the folder name as: [notation] - [label]
                    new_folder_name = f"{notation} - {pref_label_en}"

                    # Sanitize the name to remove illegal characters
                    safe_folder_name = sanitize_folder_name(new_folder_name)

                    # Create the new "shelf" (folder)
                    new_folder_path = os.path.join(LIBRARY_NAME, safe_folder_name)
                    if not os.path.exists(new_folder_path):
                        os.makedirs(new_folder_path)
                        print(f"  > Created shelf: {safe_folder_name}")
                        folders_created += 1
                else:
                    print(f"  ! Skipping '{filename}': Missing 'notation' or English 'prefLabel'.")
                    files_skipped += 1

            except json.JSONDecodeError:
                print(f"  ! Skipping '{filename}': Not a valid JSON file.")
                files_skipped += 1
            except Exception as e:
                print(f"  ! An unexpected error occurred with '{filename}': {e}")
                files_skipped += 1

    print("\n--- Library Construction Complete ---")
    print(f"Successfully created {folders_created} shelves.")
    print(f"Skipped {files_skipped} files due to missing data or errors.")

if __name__ == '__main__':
    build_library_shelves()