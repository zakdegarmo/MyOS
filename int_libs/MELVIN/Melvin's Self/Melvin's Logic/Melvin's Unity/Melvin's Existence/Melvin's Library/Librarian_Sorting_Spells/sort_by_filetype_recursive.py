import os
import shutil
import re

# --- Configuration (FOR OLE SMOOTHY!) ---
# This script is designed to be run from inside the folder you want to sort.
# It will process files in the current directory AND recursively in all subfolders.
# All files will be moved to type-specific folders created directly under TARGET_DIRECTORY.
TARGET_DIRECTORY = os.getcwd() # Gets the current working directory dynamically

# --- Main Sorting Function ---
def sort_files_by_extension_recursive(target_dir):
    """
    Recursively sorts all files in the given directory and its subdirectories by their file extension.
    Creates type-specific subfolders (e.g., 'txt_files', 'json_files') directly under the TARGET_DIRECTORY.
    Moves files to these top-level type folders.
    Removes empty subdirectories after sorting.
    """
    print(f"Initiating RECURSIVE file sorting by extension in: {target_dir}")
    print("-----------------------------------------------------------------")

    files_to_move = []
    folders_to_delete = [] # To store empty subdirectories for later cleanup
    
    # Pass 1: Collect files to move
    # os.walk(topdown=True) is used here to identify files and subdirectories.
    # We collect dirpaths that might become empty later.
    for dirpath, dirnames, filenames in os.walk(target_dir, topdown=True):
        # Skip the root directory itself when considering it for deletion
        if dirpath != target_dir:
            folders_to_delete.append(dirpath) # Add all subdirectories, will filter later if they're not empty

        for filename in filenames:
            # Skip the script itself if it's found in a subdirectory
            if filename == os.path.basename(__file__) and dirpath == target_dir:
                continue

            item_full_path = os.path.join(dirpath, filename)
            _, extension = os.path.splitext(filename)
            
            # Determine destination folder name (e.g., 'txt_files', 'json_files')
            folder_name = "no_extension_files"
            if extension:
                folder_name = extension[1:].lower() + "_files"
            
            destination_folder_path = os.path.join(target_dir, folder_name) # Always move to top-level bin

            # Propose creation of destination folder if it doesn't exist
            if not os.path.exists(destination_folder_path):
                files_to_move.append({
                    'type': 'mkdir', 
                    'path': destination_folder_path,
                    'display': f"Create folder: '{os.path.basename(destination_folder_path)}'"
                })

            # Propose moving the file
            files_to_move.append({
                'type': 'move_file',
                'src': item_full_path,
                'dest_folder': destination_folder_path,
                'display': f"Move '{os.path.relpath(item_full_path, target_dir)}' -> '{os.path.relpath(destination_folder_path, target_dir)}/{filename}'"
            })
    
    if not files_to_move:
        print("No files found to sort recursively in this directory.")
        return

    print("\nProposed Actions (Move Files):")
    # Filter out duplicate mkdir proposals for the same folder
    unique_actions = []
    seen_paths = set()
    for action in files_to_move:
        if action['type'] == 'mkdir':
            if action['path'] not in seen_paths:
                unique_actions.append(action)
                seen_paths.add(action['path'])
        else:
            unique_actions.append(action)
    
    for action in unique_actions:
        print(f"  - {action['display']}")
    
    print(f"\n{len([a for a in unique_actions if a['type'] == 'move_file'])} files will be moved recursively.")
    confirm_move = input("Proceed with moving files? (y/N): ")
    
    if confirm_move.lower() == 'y':
        for action in unique_actions:
            try:
                if action['type'] == 'mkdir' and not os.path.exists(action['path']):
                    os.makedirs(action['path'])
                    # print(f"Created folder: '{os.path.basename(action['path'])}'") # Already in proposed list
                elif action['type'] == 'move_file':
                    # Ensure destination folder exists (might have been created by another action in this list)
                    if not os.path.exists(action['dest_folder']):
                        os.makedirs(action['dest_folder'])
                    shutil.move(action['src'], action['dest_folder'])
                    print(f"Moved: '{os.path.relpath(action['src'], target_dir)}' -> '{os.path.relpath(action['dest_folder'], target_dir)}/{os.path.basename(action['src'])}'")
            except Exception as e:
                print(f"Error performing action '{action['display']}': {e}")
        print("\nRecursive file moving pass complete.")
    else:
        print("File moving cancelled by user.")
        return # Exit if files aren't moved, as folder cleanup depends on it

    # Pass 2: Clean up empty subdirectories
    print("\n--- PASS 2: Proposing Empty Folder Deletion ---")
    # Reverse sort by path length to delete deepest empty folders first
    folders_to_delete.sort(key=len, reverse=True) 
    
    actual_folders_to_delete = []
    for folder_path in folders_to_delete:
        try:
            # Check if the folder is truly empty (contains no files or subdirectories itself)
            if not os.listdir(folder_path): # os.listdir returns empty list if folder is empty
                actual_folders_to_delete.append(folder_path)
            else:
                # If it's not empty, it means we moved files out of it, but it still contains subfolders
                # that themselves might contain files. This indicates a non-empty sub-tree.
                pass # Don't propose for deletion
        except OSError as e:
            # Folder might have been deleted as part of another action (e.g., if a parent was empty)
            pass 

    if not actual_folders_to_delete:
        print("No empty subdirectories found to delete.")
    else:
        print(f"\n{len(actual_folders_to_delete)} empty subdirectories proposed for deletion:")
        for folder_path in actual_folders_to_delete:
            print(f"  - '{os.path.relpath(folder_path, target_dir)}'")
        
        confirm_delete = input("Proceed with deleting empty subdirectories? (y/N): ")
        if confirm_delete.lower() == 'y':
            for folder_path in actual_folders_to_delete:
                try:
                    os.rmdir(folder_path) # os.rmdir only deletes empty directories
                    print(f"Deleted empty folder: '{os.path.relpath(folder_path, target_dir)}'")
                except OSError as e:
                    print(f"Error deleting empty folder '{os.path.relpath(folder_path, target_dir)}': {e}")
            print("\nEmpty folder cleanup pass complete.")
        else:
            print("Empty folder cleanup cancelled by user.")

    print("\n-----------------------------------------------------------------")
    print("Recursive file sorting and empty folder cleanup finished for ole smoothy.")

if __name__ == "__main__":
    sort_files_by_extension_recursive(TARGET_DIRECTORY)