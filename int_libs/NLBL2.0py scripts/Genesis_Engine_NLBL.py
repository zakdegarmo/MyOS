import os
import shutil
import time

# --- Meta Script Configuration ---
# Template for the NLBLn.py script content
# This template will be filled with specific values for each base (n).
NLBL_SCRIPT_TEMPLATE = """
import os
import shutil
import time

# --- Configuration (FOR OLE SMOOTHY!) ---
NLBL_VALUE = {nlbl_value} # Defines the base for this specific script

# <--- MODIFIED: User input for SANDBOX_BASE_PATH ---
def get_sandbox_base_path():
    default_path = os.path.join(os.path.expanduser("~"), "Desktop", f"NLBL{{NLBL_VALUE}}")
    prompt = f"Enter the path where you want to create NLBL{{NLBL_VALUE}} (default: {{default_path}}): "
    user_input = input(prompt).strip()
    if user_input == "":
        return default_path
    else:
        return user_input

SANDBOX_BASE_PATH = get_sandbox_base_path()
# --- END MODIFIED ---

# --- Fractal Generation Parameters ---
BASE_DIGITS = [str(i) for i in range(1, NLBL_VALUE + 1)] # Digits 1 to NLBL_VALUE
RECURSIVE_DEPTH = NLBL_VALUE # Depth is equal to the NLBL_VALUE

def clean_and_create_dir(path):
    \"\"\"
    Ensures a directory is empty and exists.
    Prompts for confirmation before deleting existing non-empty directories.
    \"\"\"
    if os.path.exists(path):
        if os.path.isdir(path):
            if os.listdir(path): # Check if directory is not empty
                confirm = input(f"  Warning: Directory '{{path}}' is not empty. Delete its contents and overwrite with new fractal? (y/N): ")
                if confirm.lower() == 'y':
                    print(f"  Deleting contents of '{{path}}'...")
                    try:
                        shutil.rmtree(path)
                    except Exception as e:
                        print(f"  ERROR: Could not clear directory '{{path}}'. Please delete it manually and try again. Reason: {{e}}")
                        return False
                else:
                    print(f"  Skipping creation of fractal in '{{path}}'. Manual intervention needed if you want to proceed.")
                    return False # Indicate that creation was skipped
            else:
                print(f"  Directory '{{path}}' already exists and is empty. Proceeding.")
        else: # It's a file, not a directory
            print(f"ERROR: A file or link named '{{path}}' already exists. Please remove it manually.")
            return False
    
    try:
        os.makedirs(path, exist_ok=True)
        print(f"  Created '{{os.path.basename(path)}}'")
        return True
    except Exception as e:
        print(f"ERROR: Could not create directory '{{os.path.basename(path)}}'. Reason: {{e}}")
        return False

def create_nested_folders(current_path, current_depth, max_depth, base_digits):
    \"\"\"
    Recursively creates nested folders (1,2,...) up to a specified depth.
    \"\"\"
    if current_depth >= max_depth:
        return

    for digit in base_digits:
        folder_name = digit
        new_path = os.path.join(current_path, folder_name)
        
        try:
            os.makedirs(new_path, exist_ok=True)
            create_nested_folders(new_path, current_depth + 1, max_depth, base_digits)
        except Exception as e:
            print(f"ERROR: Could not create nested folder '{{folder_name}}'. Reason: {{e}}")


def main():
    print(f"Initiating NLBL{{NLBL_VALUE}} Fractal Generation (Base-{{NLBL_VALUE}}, Depth {{RECURSIVE_DEPTH}}).")
    print(f"Creating sandbox at: {{SANDBOX_BASE_PATH}}")

    # Step 1: Create root directory 'NLBLn'
    print("\\n--- Step 1: Creating root directory ---")
    if not clean_and_create_dir(SANDBOX_BASE_PATH):
        return

    # Create the central '0' folder
    zero_folder_path = os.path.join(SANDBOX_BASE_PATH, '0')
    if not clean_and_create_dir(zero_folder_path): return

    print(f"\\n--- Steps 2 & 3: Creating fractal structure inside '0' folder ---")
    for digit in BASE_DIGITS:
        initial_branch_path = os.path.join(zero_folder_path, digit)
        os.makedirs(initial_branch_path, exist_ok=True)
        create_nested_folders(initial_branch_path, 1, RECURSIVE_DEPTH, BASE_DIGITS)

    # Step 4: Move top-level branches into the '0' folder
    print("\\n--- Step 4: Moving top-level branches into '0' folder (Final Structure) ---")
    
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
                print(f"SUCCESS: Moved '{{item_name}}' into '{{os.path.basename(zero_folder_path)}}'.")
            except Exception as e:
                print(f"ERROR: Could not move '{{item_name}}' into '0' folder. Reason: {{e}}")
    
    print("\\nFinal structure complete. You can explore the structure.")
    print(f"To view: cd {{SANDBOX_ROOT_DIR_NAME}} then tree")


if __name__ == '__main__':
    main()
"""

def generate_nlbl_scripts(output_dir):
    """
    Generates NLBLn.py scripts for n=1 to 9 in the specified output directory.
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created output directory: {output_dir}")
    else:
        print(f"Output directory '{output_dir}' already exists.")

    for n in range(1, 10): # For NLBL1.py through NLBL9.py
        script_filename = os.path.join(output_dir, f"NLBL{n}.py")
        
        nlbl_value = n
        base_digits = [str(i) for i in range(1, n + 1)]
        
        script_content = NLBL_SCRIPT_TEMPLATE.format(
            nlbl_value=nlbl_value,
            base_digits=base_digits
        )
        
        with open(script_filename, 'w') as f:
            f.write(script_content)
        print(f"Generated {os.path.basename(script_filename)}")

if __name__ == '__main__':
    print("This script will generate NLBLn.py scripts (for n=1 to 9).")
    output_location = input("Enter the path where you want to save these scripts (e.g., C:\\Users\\zakde\\Desktop\\NLBL.py scripts): ")
    
    generate_nlbl_scripts(output_location)
    print("\nAll NLBL scripts generated successfully! Ready for testing.")