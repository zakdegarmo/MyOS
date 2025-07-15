import os
import re

# --- Configuration (FOR OLE SMOOTHY!) ---
# This script is designed to be run from inside the DeweyDeciMatrix root folder.
# It will process all .json files found recursively within this directory.
DEWEY_MATRIX_ROOT = os.getcwd() # Gets the current working directory dynamically

# --- Helper Function for NLD ID Formatting for FILES ---

def format_json_filename_to_nld(filename):
    """
    Transforms a .json filename (e.g., '353.json') into the NLD format '0000-0000-0###.json'.
    The '0###' is derived from the original numeric part of the filename, padded to 3 digits.
    Assumes the base part of the filename is a purely numeric string.
    """
    base_name, ext = os.path.splitext(filename)
    
    # Check if the part before the extension is purely numeric
    if re.fullmatch(r'\d+', base_name):
        numeric_value = int(base_name)
        # Pad to 3 digits with leading zeros for the final DDC part (e.g., 353 -> '353', 3 -> '003')
        padded_ddc = str(numeric_value).zfill(3)
        
        # Construct the new filename in the exact requested format: '0000-0000-0###.json'
        # BaseLogic is 0000, DeweyMatrix is 0000, and the DDC is the padded numeric value.
        new_filename = f"0000-0000-0{padded_ddc}.json"
        return new_filename
    
    # If the base_name is not purely numeric, return original filename
    # This prevents renaming files like 'README.json' or 'MyData.json'
    return filename

# --- Main File Renaming Function ---
def rename_json_files_to_nld_format(root_dir):
    """
    Walks the specified root directory (bottom-up is not strictly necessary for files, top-down is fine)
    and renames .json files to the NLD ####-####-0###.json format.
    Does NOT touch folders.
    """
    print(f"Initiating JSON file renaming to NLD format in: {root_dir}")
    print("-----------------------------------------------------------------")

    file_renames_proposed = []
    
    # os.walk(topdown=True) is sufficient here as we only rename files, not the directories they are in.
    for dirpath, dirnames, filenames in os.walk(root_dir, topdown=True):
        for filename in filenames:
            if filename.lower().endswith('.json'):
                old_full_path = os.path.join(dirpath, filename)
                new_filename = format_json_filename_to_nld(filename)
                new_full_path = os.path.join(dirpath, new_filename)

                if old_full_path != new_full_path:
                    file_renames_proposed.append((old_full_path, new_full_path))
    
    if not file_renames_proposed:
        print("No JSON files found that need renaming to the NLD format.")
    else:
        print(f"\n{len(file_renames_proposed)} JSON file renames proposed:")
        for old_p, new_p in file_renames_proposed:
            print(f"  '{os.path.relpath(old_p, root_dir)}' -> '{os.path.relpath(new_p, root_dir)}'")
        
        confirm_files = input("Proceed with renaming JSON files? (y/N): ")
        if confirm_files.lower() == 'y':
            for old_p, new_p in file_renames_proposed:
                try:
                    os.rename(old_p, new_p)
                    print(f"Renamed file: '{os.path.relpath(old_p, root_dir)}' -> '{os.path.relpath(new_p, root_dir)}'")
                except OSError as e:
                    print(f"Error renaming file '{os.path.relpath(old_p, root_dir)}': {e}")
            print("\nJSON file renaming pass complete.")
        else:
            print("File renaming cancelled by user.")

    print("\n-----------------------------------------------------------------")
    print("JSON filename NLD renaming script finished for ole smoothy.")

if __name__ == "__main__":
    if not os.path.exists(DEWEY_MATRIX_ROOT):
        print(f"Error: Dewey Matrix root directory not found at '{DEWEY_MATRIX_ROOT}'")
    else:
        rename_json_files_to_nld_format(DEWEY_MATRIX_ROOT)