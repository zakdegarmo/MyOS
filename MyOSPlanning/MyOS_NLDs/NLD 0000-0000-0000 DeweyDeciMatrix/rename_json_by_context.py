import os
import json
import re

# --- Configuration for this script (FOR OLE SMOOTHY!) ---
# This script is designed to be run from C:\MyOS\ or any directory that can access the target folder.
# It will prompt the user for the target directory.

# --- Helper Functions ---

def create_safe_filename(context_value):
    """
    Creates a filesystem-safe filename from a @context string (likely a URI/URL).
    Prioritizes text after the last '/' or '#', then sanitizes.
    """
    if not isinstance(context_value, str):
        return f"unnamed_context_{os.urandom(4).hex()}" # Fallback for non-string context

    # 1. Try to extract part after '#' (fragment identifier)
    if '#' in context_value:
        name_part = context_value.split('#')[-1]
    # 2. If no '#', try to extract part after last '/' (path segment)
    elif '/' in context_value:
        name_part = context_value.split('/')[-1]
    else:
        name_part = context_value

    # 3. Sanitize the extracted part for filesystem use
    # Replace invalid characters with underscore
    safe_name = re.sub(r'[\\/:*?"<>|]', '_', name_part)
    # Remove leading/trailing spaces, and ensure it's not empty
    safe_name = safe_name.strip()
    if not safe_name: # Fallback if sanitization results in empty string
        safe_name = f"empty_context_{os.urandom(4).hex()}"

    # Limit length to prevent very long filenames (common filesystem limit is 255 chars)
    return safe_name[:200]

# --- Main Renaming Function ---
def rename_json_files_by_context(target_directory):
    """
    Walks the specified directory and renames .json files based on their @context field.
    """
    if not os.path.isdir(target_directory):
        print(f"Error: Target directory '{target_directory}' not found.")
        return

    print(f"Initiating JSON file renaming based on @context field in: {target_directory}")
    print("-----------------------------------------------------------------------")

    files_to_rename = []
    potential_collisions = {}

    for dirpath, dirnames, filenames in os.walk(target_directory):
        for filename in filenames:
            if filename.lower().endswith('.json'):
                full_path = os.path.join(dirpath, filename)
                try:
                    with open(full_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    
                    context_value = data.get('@context')
                    if context_value:
                        new_base_name = create_safe_filename(context_value)
                        new_filename = f"{new_base_name}.json"
                        new_full_path = os.path.join(dirpath, new_filename)

                        if full_path != new_full_path:
                            # Check for potential collision *before* adding to proposed list
                            if new_full_path in potential_collisions:
                                potential_collisions[new_full_path].append(full_path)
                            else:
                                potential_collisions[new_full_path] = [full_path]
                                files_to_rename.append((full_path, new_full_path))
                    else:
                        print(f"Warning: File '{os.path.relpath(full_path, target_directory)}' has no '@context' field or it's empty. Skipping.")

                except json.JSONDecodeError:
                    print(f"Warning: File '{os.path.relpath(full_path, target_directory)}' is not a valid JSON file. Skipping.")
                except Exception as e:
                    print(f"Error processing '{os.path.relpath(full_path, target_directory)}': {e}. Skipping.")
    
    if not files_to_rename and not potential_collisions:
        print("No .json files found with a valid '@context' field requiring renaming.")
        return

    # Report potential collisions first
    if potential_collisions:
        print("\n--- POTENTIAL FILENAME COLLISIONS DETECTED ---")
        print("The following new filenames would overwrite existing or other renamed files:")
        for new_path, original_paths in potential_collisions.items():
            if len(original_paths) > 1: # Only report if truly a collision of multiple originals
                print(f"  New Name: '{os.path.relpath(new_path, target_directory)}' would be created from:")
                for op in original_paths:
                    print(f"    - '{os.path.relpath(op, target_directory)}'")
        print("---------------------------------------------")
        print("Please resolve collisions manually or adjust the `create_safe_filename` function if unique IDs are needed.")
        print("Exiting without performing any renames due to potential data loss.")
        return

    print(f"\n{len(files_to_rename)} JSON files proposed for renaming:")
    for old_p, new_p in files_to_rename:
        print(f"  '{os.path.relpath(old_p, target_directory)}' -> '{os.path.relpath(new_p, target_directory)}'")
        
    confirm_renames = input("Proceed with renaming? (y/N): ")
    if confirm_renames.lower() == 'y':
        for old_p, new_p in files_to_rename:
            try:
                os.rename(old_p, new_p)
                print(f"Renamed: '{os.path.relpath(old_p, target_directory)}' -> '{os.path.relpath(new_p, target_directory)}'")
            except OSError as e:
                print(f"Error renaming '{os.path.relpath(old_p, target_directory)}': {e}")
        print("\nJSON file renaming pass complete.")
    else:
        print("Renaming cancelled by user.")

    print("\n-----------------------------------------------------------------------")
    print("JSON file renaming by @context script finished for ole smoothy.")

if __name__ == "__main__":
    target_dir_input = input(f"Enter the path to the directory containing your JSON files (e.g., '{os.getcwd()}\\Consolidated_JSONs_Hub'): ")
    rename_json_files_by_context(target_dir_input)