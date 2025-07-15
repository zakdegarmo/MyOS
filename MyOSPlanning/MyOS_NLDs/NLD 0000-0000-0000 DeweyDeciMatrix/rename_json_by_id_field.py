import os
import json
import re
import urllib.parse # For parsing URLs

# --- Configuration for this script ---
# This script is designed to be run from C:\MyOS\ or any directory that can access the target folder.
# It will prompt the user for the target directory.

# --- Helper Function ---

def create_safe_filename_from_id(id_value):
    """
    Creates a filesystem-safe filename from an 'id' string (assumed to be a URI/URL).
    Extracts the last path segment or fragment, then sanitizes.
    Example: "https://id.oclc.org/worldcat/ddc/E33pKJkT4v4WvPJWxChwvmBPKg" -> "E33pKJkT4v4WvPJWxChwvmBPKg"
    """
    if not isinstance(id_value, str):
        return f"unnamed_id_{os.urandom(4).hex()}" # Fallback for non-string ID

    parsed_url = urllib.parse.urlparse(id_value)
    
    # Prioritize fragment if it exists (part after #)
    if parsed_url.fragment:
        name_part = parsed_url.fragment
    # Otherwise, use the last path segment
    else:
        name_part = parsed_url.path.split('/')[-1]
        if not name_part and parsed_url.hostname: # If path is empty, use hostname or a part of it
            name_part = parsed_url.hostname.split('.')[0] # e.g., 'id' from 'id.oclc.org'

    # Sanitize the extracted part for filesystem use
    # Replace invalid characters with underscore, and remove leading/trailing spaces
    safe_name = re.sub(r'[\\/:*?"<>|]', '_', name_part).strip()
    
    # Ensure it's not empty after sanitization; add a unique suffix if it is
    if not safe_name:
        safe_name = f"empty_id_{os.urandom(4).hex()}"

    return safe_name[:200] # Limit length to prevent very long filenames

# --- Main Renaming Function ---
def rename_json_files_by_id_field(target_directory):
    """
    Walks the specified directory and renames .json files based on their 'id' field.
    """
    if not os.path.isdir(target_directory):
        print(f"Error: Target directory '{target_directory}' not found.")
        return

    print(f"Initiating JSON file renaming based on 'id' field in: {target_directory}")
    print("-----------------------------------------------------------------------")

    files_to_rename = []
    
    # Use a set to track proposed new full paths to detect collisions
    # Map new_full_path -> (original_path, original_filename)
    proposed_new_paths = {} 

    for dirpath, dirnames, filenames in os.walk(target_directory):
        for filename in filenames:
            if filename.lower().endswith('.json'):
                old_full_path = os.path.join(dirpath, filename)
                try:
                    with open(old_full_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    
                    id_value = data.get('id') # Extract the 'id' field
                    if id_value:
                        new_base_name = create_safe_filename_from_id(id_value)
                        new_filename = f"{new_base_name}.json"
                        new_full_path = os.path.join(dirpath, new_filename)

                        if old_full_path != new_full_path:
                            if new_full_path in proposed_new_paths:
                                # Collision detected - same new name for different original file
                                proposed_new_paths[new_full_path].append((old_full_path, filename))
                            else:
                                proposed_new_paths[new_full_path] = [(old_full_path, filename)]
                                files_to_rename.append((old_full_path, new_full_path))
                    else:
                        print(f"Warning: File '{os.path.relpath(old_full_path, target_directory)}' has no 'id' field or it's empty. Skipping.")

                except json.JSONDecodeError:
                    print(f"Warning: File '{os.path.relpath(old_full_path, target_directory)}' is not a valid JSON. Skipping.")
                except Exception as e:
                    print(f"Error processing '{os.path.relpath(old_full_path, target_directory)}': {e}. Skipping.")
    
    # Filter out actual collision cases where more than one original file maps to the same new name
    final_files_to_rename = []
    collisions_reported = False
    for new_path, original_file_data_list in proposed_new_paths.items():
        if len(original_file_data_list) > 1:
            collisions_reported = True
            print("\n--- FILENAME COLLISION DETECTED ---")
            print(f"The new name '{os.path.relpath(new_path, target_directory)}' would be generated from multiple original files:")
            for op, ofn in original_file_data_list:
                print(f"  - '{os.path.relpath(op, target_directory)}' (Original: '{ofn}')")
            print("These files cannot be renamed automatically due to conflict. Please handle manually.")
        else:
            final_files_to_rename.append(original_file_data_list[0]) # Add the (old_path, new_path) tuple


    if not final_files_to_rename:
        if not collisions_reported:
            print("No JSON files found with a valid 'id' field requiring unique renaming.")
        return

    print(f"\n{len(final_files_to_rename)} JSON files proposed for renaming:")
    for old_p, new_p in final_files_to_rename:
        print(f"  '{os.path.relpath(old_p, target_directory)}' -> '{os.path.relpath(new_p, target_directory)}'")
        
    confirm_renames = input("Proceed with renaming? (y/N): ")
    if confirm_renames.lower() == 'y':
        for old_p, new_p in final_files_to_rename:
            try:
                os.rename(old_p, new_p)
                print(f"Renamed: '{os.path.relpath(old_p, target_directory)}' -> '{os.path.relpath(new_p, target_directory)}'")
            except OSError as e:
                print(f"Error renaming '{os.path.relpath(old_p, target_directory)}': {e}")
        print("\nJSON file renaming based on 'id' field complete.")
    else:
        print("Renaming cancelled by user.")

    print("\n-----------------------------------------------------------------------")
    print("JSON file renaming by 'id' field script finished for ole smoothy.")

if __name__ == "__main__":
    target_dir_input = input(f"Enter the path to the directory containing your JSON files (e.g., '{os.getcwd()}\\Consolidated_JSONs_Hub'): ")
    rename_json_files_by_id_field(target_dir_input)