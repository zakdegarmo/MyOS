import os
import re

# --- Configuration ---
# The root path of your DeweyDeciMatrix structure relative to C:\MyOS\
DEWEY_MATRIX_ROOT = os.path.join(
    'MyOSPlanning',
    'MyOS_NLDs',
    'NLD 0000-0000-0000 DeweyDeciMatrix'
)

def pad_folder_name(folder_name):
    """Pads a numeric folder name to 4 digits with leading zeros."""
    # Check if the folder name is purely numeric
    if re.fullmatch(r'\d+', folder_name):
        return folder_name.zfill(4)
    return folder_name # Return original if not numeric (e.g., 'InBox')

def rename_dewey_folders(root_dir):
    """
    Walks a directory tree (top-down) and renames numeric folders
    to ensure they are 4 digits with leading zeros.
    Uses os.rename which is safe for Git to track as renames.
    """
    print(f"Scanning for folders to rename in: {root_dir}")
    print("--------------------------------------------------")

    changes_proposed = []

    # os.walk yields (dirpath, dirnames, filenames)
    # We iterate sorted dirnames to ensure consistent order
    for dirpath, dirnames, _ in os.walk(root_dir, topdown=True):
        # Sort dirnames to process children consistently if needed,
        # but crucial for topdown=True as it processes parent before children.
        # We'll rename them in reverse order to avoid issues if names overlap
        # (e.g., 001 -> 0001, then trying to rename 0001 to something else if 
        # it was a different folder. Not usually an issue with padding, but safer.)
        
        # We need to process dirnames in a copy because we're modifying them during iteration
        # This is how os.walk recommends handling it when renaming dirs in place
        dirnames_copy = list(dirnames) 
        dirnames_copy.sort(reverse=True) # Process deepest children first if names could clash on rename

        for dirname in dirnames_copy:
            old_path = os.path.join(dirpath, dirname)
            new_name = pad_folder_name(dirname)
            new_path = os.path.join(dirpath, new_name)

            if old_path != new_path:
                changes_proposed.append((old_path, new_path))
    
    if not changes_proposed:
        print("No folders found that need renaming according to the 4-digit padding rule.")
        return

    print("\nProposed Folder Renames:")
    for old_p, new_p in changes_proposed:
        print(f"  '{os.path.relpath(old_p, root_dir)}'  ->  '{os.path.relpath(new_p, root_dir)}'")
    
    print(f"\n{len(changes_proposed)} folders will be renamed.")
    confirm = input("Proceed with renaming? (y/N): ")
    
    if confirm.lower() == 'y':
        for old_p, new_p in changes_proposed:
            try:
                os.rename(old_p, new_p)
                print(f"Renamed: '{os.path.relpath(old_p, root_dir)}' -> '{os.path.relpath(new_p, root_dir)}'")
            except OSError as e:
                print(f"Error renaming '{os.path.relpath(old_p, root_dir)}': {e}")
        print("\nFolder renaming complete.")
    else:
        print("Renaming cancelled by user.")

if __name__ == "__main__":
    # Ensure this script is run from C:\MyOS\ or adjust DEWEY_MATRIX_ROOT
    if not os.path.exists(DEWEY_MATRIX_ROOT):
        print(f"Error: Dewey Matrix root directory not found at '{DEWEY_MATRIX_ROOT}'")
        print("Please ensure you are running this script from C:\\MyOS\\ or adjust the DEWEY_MATRIX_ROOT path in the script.")
    else:
        rename_dewey_folders(DEWEY_MATRIX_ROOT)