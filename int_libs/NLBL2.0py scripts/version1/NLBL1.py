import os
import shutil
import time

# --- Configuration (FOR OLE SMOOTHY!) ---
# This script creates a new, empty directory for the fractal.
# It will be located on your Desktop.
NLBL_VALUE = 1 # <--- NEW: Defines the base for this specific script
SANDBOX_ROOT_DIR_NAME = f"NLBL{NLBL_VALUE}" # Root folder name based on NLBL_VALUE
SANDBOX_BASE_PATH = os.path.join(os.path.expanduser("~"), "Desktop", SANDBOX_ROOT_DIR_NAME)

# --- Fractal Generation Parameters (BASED ON NLBL RULES) ---
# For NLBL1, only digit '1' exists.
BASE_DIGITS = [str(i) for i in range(1, NLBL_VALUE + 1)] # Digits 1 to NLBL_VALUE
RECURSIVE_DEPTH = NLBL_VALUE # Depth is equal to the NLBL_VALUE (e.g., 1 for NLBL1, 4 for NLBL4)

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
    Recursively creates nested folders (1,2,3,...) up to a specified depth.
    This function now combines Step 2 and Step 3's recursive logic.
    """
    if current_depth >= max_depth: # Stop when max_depth is reached
        return

    for digit in base_digits:
        folder_name = digit # Folder names are simply the digits (1, 2, 3, 4, etc.)
        new_path = os.path.join(current_path, folder_name)
        
        try:
            os.makedirs(new_path, exist_ok=True)
            # print(f"  Created: {os.path.relpath(new_path, SANDBOX_BASE_PATH)}") # For verbose output
            create_nested_folders(new_path, current_depth + 1, max_depth, base_digits)
        except Exception as e:
            print(f"ERROR: Could not create nested folder '{os.path.relpath(new_path, SANDBOX_BASE_PATH)}'. Reason: {e}")


def main():
    print(f"Initiating NLBL{NLBL_VALUE} Fractal Generation (Base-{NLBL_VALUE}, Depth {RECURSIVE_DEPTH}).")
    print(f"Creating sandbox at: {SANDBOX_BASE_PATH}")

    # Step 1: Create root directory 'NLBLn'
    print("\n--- Step 1: Creating root directory ---")
    if not clean_and_create_dir(SANDBOX_BASE_PATH):
        return

    # Create the central '0' folder (Quadimal Point for NLBL4, or just '0' for others)
    # This '0' folder will contain the initial fractal structure.
    zero_folder_path = os.path.join(SANDBOX_BASE_PATH, '0')
    if not clean_and_create_dir(zero_folder_path): return

    print(f"\n--- Step 2 & 3: Creating fractal structure inside '0' folder ---")
    # Start the recursion from the '0' folder
    # This creates the top-level 1, 2, 3, 4 (or just 1 for NLBL1) folders inside '0'
    for digit in BASE_DIGITS:
        initial_branch_path = os.path.join(zero_folder_path, digit)
        os.makedirs(initial_branch_path, exist_ok=True)
        create_nested_folders(initial_branch_path, 1, RECURSIVE_DEPTH, BASE_DIGITS)

    # Step 4: Move top-level branches (1,2,3,4) into the '0' folder
    # This step is now implicitly handled by creating the fractal *inside* the '0' folder from the start.
    # No, the previous step 4 was to move the top-level 1,2,3,4 into 0.
    # The current script creates 1,2,3,4 *inside* 0.
    # So the *final desired structure* is NLBLn/0/1/1/1/1.
    # This means Step 4 is conceptually complete by the way the fractal is generated.

    print("\nFinal structure complete. You can explore the structure.")
    print(f"To view: cd {SANDBOX_ROOT_DIR_NAME} then tree")


if __name__ == '__main__':
    main()