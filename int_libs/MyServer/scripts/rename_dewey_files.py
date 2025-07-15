import os
import json

# The directory where the downloaded Dewey JSON files are stored.
# This script assumes it is run from a parent directory of this folder.
DEWEY_JSON_DIR = 'Dewey_Concepts_JSON'

def sanitize_filename(url):
    """
    Takes a URL and converts it into a safe string for a filename
    by replacing illegal characters.
    """
    # The truly unique part is the ID at the end of the URL.
    # We will extract it for a cleaner filename.
    unique_id = url.split('/')[-1]
    return unique_id

def rename_files_by_id():
    """
    Scans the DEWEY_JSON_DIR, reads each JSON file, and renames it
    using the value of its internal 'id' field.
    """
    if not os.path.isdir(DEWEY_JSON_DIR):
        print(f"Error: Directory '{DEWEY_JSON_DIR}' not found.")
        print("Please make sure this script is in the same folder as the 'Dewey_Concepts_JSON' directory.")
        return

    print(f"Scanning for files in '{DEWEY_JSON_DIR}'...")
    
    renamed_count = 0
    error_count = 0

    for filename in os.listdir(DEWEY_JSON_DIR):
        if filename.endswith('.json'):
            old_filepath = os.path.join(DEWEY_JSON_DIR, filename)
            
            try:
                with open(old_filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                # Check if the 'id' field exists
                if 'id' in data and data['id']:
                    # Sanitize the ID to make it a valid filename
                    new_filename_base = sanitize_filename(data['id'])
                    new_filename = new_filename_base + ".json"
                    new_filepath = os.path.join(DEWEY_JSON_DIR, new_filename)

                    # Rename the file
                    os.rename(old_filepath, new_filepath)
                    print(f"Renamed '{filename}' -> '{new_filename}'")
                    renamed_count += 1
                else:
                    print(f"Skipping '{filename}': does not contain an 'id' field.")
                    error_count += 1

            except json.JSONDecodeError:
                print(f"Skipping '{filename}': not a valid JSON file.")
                error_count += 1
            except Exception as e:
                print(f"An error occurred with file '{filename}': {e}")
                error_count += 1

    print("\n--- Renaming Complete ---")
    print(f"Successfully renamed: {renamed_count} files.")
    print(f"Skipped (no ID or error): {error_count} files.")

if __name__ == '__main__':
    rename_files_by_id()