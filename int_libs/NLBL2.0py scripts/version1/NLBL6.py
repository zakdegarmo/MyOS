import os
import shutil
import time

# --- Configuration (FOR OLE SMOOTHY!) ---
# This script creates a new, empty directory for the fractal.
# It will be located on your Desktop.
NLBL_VALUE = 6 # <--- Defines the base for this specific script
SANDBOX_ROOT_DIR_NAME = f"NLBL{NLBL_VALUE}" # Root folder name based on NLBL_VALUE
SANDBOX_BASE_PATH = os.path.join(os.path.expanduser("~"), "Desktop", SANDBOX_ROOT_DIR_NAME)

# --- Fractal Generation Parameters ---
BASE_DIGITS = [str(i) for i in range(1, NLBL_VALUE + 1)] # Digits 1 to NLBL_VALUE
RECURSIVE_DEPTH = NLBL_VALUE # Depth is equal to the NLBL_VALUE

def clean_and_create_dir(path):
    """Ensures a directory is empty and exists."""
    if os.path.exists(path):
        print(f"  Warning: Directory '{path}' already exists. Deleting its contents...")
        try:
            shutil.rmtree(path)
            print(f"  Contents of '{path}' deleted.")
        except Exception as e:
            print(f"  ERROR: Could not clear directory '{path}'. Please delete it manually and try again. Reason: {e}")
            return False
    
    try:
        os.makedirs(path)
        print(f"  Created '{os.path.basename(path)}'")
        return True
    except Exception as e:
        print(f"  ERROR: Could not create directory '{path}'. Reason: {e}")
        return False

def create_nested_folders(current_path, current_depth, max_depth, base_digits):
    """
    Recursively creates nested folders (1,2,...) up to a specified depth.
    """
    if current_depth >= max_depth: # Stop when max_depth is reached
        return

    for digit in base_digits:
        folder_name = digit # Folder names are simply the digits (1, 2, 3, etc.)
        new_path = os.path.join(current_path, folder_name)
        
        try:
            os.makedirs(new_path, exist_ok=True)
            create_nested_folders(new_path, current_depth + 1, max_depth, base_digits)
        except Exception as e:
            print(f"ERROR: Could not create nested folder '{folder_name}'. Reason: {e}")


def main():
    print(f"Initiating NLBL{NLBL_VALUE} Fractal Generation (Base-{NLBL_VALUE}, Depth {RECURSIVE_DEPTH}).")
    print(f"Creating sandbox at: {SANDBOX_BASE_PATH}")

    # Step 1: Create root directory 'NLBLn'
    print("\n--- Step 1: Creating root directory ---")
    if not clean_and_create_dir(SANDBOX_BASE_PATH):
        return

    # Create the central '0' folder
    zero_folder_path = os.path.join(SANDBOX_BASE_PATH, '0')
    if not clean_and_create_dir(zero_folder_path): return

    print(f"\n--- Steps 2 & 3: Creating fractal structure inside '0' folder ---")
    for digit in BASE_DIGITS:
        initial_branch_path = os.path.join(zero_folder_path, digit)
        os.makedirs(initial_branch_path, exist_ok=True)
        create_nested_folders(initial_branch_path, 1, RECURSIVE_DEPTH, BASE_DIGITS)

    # Step 4: Move top-level branches into the '0' folder
    print("\n--- Step 4: Moving top-level branches into '0' folder (Final Structure) ---")
    
    items_to_move = [
        item for item in os.listdir(SANDBOX_BASE_PATH) 
        if os.path.isdir(os.path.join(SANDBOX_BASE_PATH, item)) and item != '0'
    ]
    
    if not items_to_move:
        print("No top-level branches (1,2,3,4) found to move into '0' folder. They might be already moved or not created.")
    else:
        for item_name in items_to_move:
            source_path = os.path.join(SANDBOX_BASE_PATH, item_name)
            destination_path = os.path.join(zero_folder_path, item_name)
            try:
                shutil.move(source_path, destination_path)
                print(f"SUCCESS: Moved '{item_name}' into '{os.path.basename(zero_folder_path)}'.")
            except Exception as e:
                print(f"ERROR: Could not move '{item_name}' into '0' folder. Reason: {e}")
    
    print("\nFinal structure complete. You can explore the structure.")
    print(f"To view: cd {SANDBOX_ROOT_DIR_NAME} then tree")


if __name__ == '__main__':
    main()