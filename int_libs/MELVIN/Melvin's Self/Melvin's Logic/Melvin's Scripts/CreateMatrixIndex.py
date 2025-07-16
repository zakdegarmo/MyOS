import os
import sys
import json
import hashlib
import datetime

# --- Configuration (FOR OLE SMOOTHY!) ---
MAX_SCAN_DEPTH = 3 

# Define folders to explicitly exclude from recursive scanning (full paths)
# This list is user-configurable.
# >>>>>>>>>>> YOU CAN EDIT THIS LIST IN THIS FILE TO CONTROL EXCLUSIONS <<<<<<<<<<<
EXCLUDE_DIRS = [
      # Add any other specific, large problematic directories you want to entirely skip recursion
    # Example: "C:\\Users\\zakde\\Downloads" (if very large)
]
# >>>>>>>>>>> END USER-EDITABLE EXCLUSION LIST <<<<<<<<<<<

# --- Helper Functions for Data Transformation ---

def format_bytes_adaptive(bytes_val):
    if bytes_val < 1024:
        return f"{bytes_val} B"
    elif bytes_val < 1024**2:
        return f"{round(bytes_val / 1024, 2)} KB"
    elif bytes_val < 1024**3:
        return f"{round(bytes_val / (1024**2), 2)} MB"
    elif bytes_val < 1024**4:
        return f"{round(bytes_val / (1024**3), 2)} GB"
    else: 
        return f"{round(bytes_val / (1024**4), 2)} TB"

def infer_nlbl_granularity_level(total_bytes):
    if total_bytes < 100 * 1024: return 1
    elif total_bytes < 10 * (1024**2): return 2
    elif total_bytes < 100 * (1024**2): return 3
    elif total_bytes < 10 * (1024**3): return 4
    elif total_bytes < 100 * (1024**3): return 5
    elif total_bytes < 10 * (1024**4): return 6
    elif total_bytes < 100 * (1024**4): return 7
    elif total_bytes < 1000 * (1024**4): return 8
    else: return 9

def get_directory_hash(dir_path):
    hasher = hashlib.sha256()
    hasher.update(dir_path.encode('utf-8'))
    try:
        for root, _, files in os.walk(dir_path):
            if any(root.startswith(e_path) for e_path in EXCLUDE_DIRS):
                continue
            for file_name in files:
                file_path = os.path.join(root, file_name)
                try:
                    hasher.update(file_name.encode('utf-8'))
                    hasher.update(str(os.path.getsize(file_path)).encode('utf-8'))
                except OSError:
                    pass
    except OSError:
        pass
    return hasher.hexdigest()

# --- Core Bloat Finder Logic ---

def analyze_directory_recursive(current_dir_path, current_depth, max_scan_depth, results_list):
    # Check for recursion depth limit
    if current_depth > max_scan_depth:
        return

    # Check if this path is in our explicit exclude list (to prevent hangs)
    is_explicitly_excluded = False
    for exclude_path in EXCLUDE_DIRS:
        if current_dir_path == exclude_path or current_dir_path.startswith(exclude_path + os.sep):
            is_explicitly_excluded = True
            break

    if is_explicitly_excluded:
        result_entry = {
            "SELF_directory_path": current_dir_path,
            "RESONANCE_status": "SKIPPED_EXCLUDED",
            "reason": "User-defined exclusion for performance/access",
            "MASTERY_scan_depth": current_depth
        }
        results_list.append(result_entry)
        print(json.dumps(result_entry, indent=2)) # Print immediately for real-time
        return

    total_files_in_subtree = 0
    total_bytes_in_subtree = 0
    scan_status = "SUCCESS" # Default status

    try:
        # Use os.walk to efficiently gather all files in the subtree, with exclusions
        for dirpath, dirnames, filenames in os.walk(current_dir_path):
            # Prune dirnames for the next iteration to prevent os.walk from recursing into excluded sub-branches
            dirnames[:] = [d for d in dirnames if not any(os.path.join(dirpath, d) == e_path or os.path.join(dirpath, d).startswith(e_path + os.sep) for e_path in EXCLUDE_DIRS)]

            for filename in filenames:
                file_path = os.path.join(dirpath, filename)
                try:
                    if os.path.isfile(file_path): 
                        total_files_in_subtree += 1
                        total_bytes_in_subtree += os.path.getsize(file_path)
                except OSError:
                    if scan_status == "SUCCESS":
                        scan_status = "PARTIAL_ACCESS_ERROR"
                    pass
    except OSError as e:
        scan_status = "ACCESS_DENIED_OR_ERROR"
        
    # Prepare results for the current directory
    formatted_size = format_bytes_adaptive(total_bytes_in_subtree)
    nlbl_level = infer_nlbl_granularity_level(total_bytes_in_subtree)
    avg_file_size = round(total_bytes_in_subtree / total_files_in_subtree, 2) if total_files_in_subtree > 0 else 0
    unique_hash = get_directory_hash(current_dir_path) # Calculate hash based on content

    result_entry = {
        "SELF_directory_path": current_dir_path,                 # Pillar 1
        "THOUGHT_total_files_recursive": total_files_in_subtree,  # Pillar 2
        "LOGIC_total_size_recursive_bytes": total_bytes_in_subtree, # Pillar 3
        "UNITY_total_size_formatted": formatted_size,            # Pillar 4
        "EXISTENCE_average_file_size_bytes": avg_file_size,      # Pillar 5
        "IMPROVEMENT_nlbl_granularity_level": nlbl_level,        # Pillar 6
        "MASTERY_scan_depth": current_depth,                     # Pillar 7
        "RESONANCE_status": scan_status,                         # Pillar 8
        "TRANSCENDENCE_unique_directory_hash": unique_hash,      # Pillar 9
        "TIMESTAMP": datetime.datetime.now().isoformat()         # Add timestamp for logging
    }
    results_list.append(result_entry)
    print(json.dumps(result_entry, indent=2)) # Print immediately for real-time


    # Recurse into direct subdirectories (if within depth limit and not explicitly excluded)
    if current_depth < max_scan_depth and scan_status != "ACCESS_DENIED_OR_ERROR": 
        try:
            for item_name in os.listdir(current_dir_path):
                item_path = os.path.join(current_dir_path, item_name)
                if os.path.isdir(item_path):
                    is_sub_dir_excluded = False
                    for exclude_path in EXCLUDE_DIRS:
                        if item_path == exclude_path or item_path.startswith(exclude_path + os.sep):
                            is_sub_dir_excluded = True
                            break
                    
                    if not is_sub_dir_excluded:
                        analyze_directory_recursive(item_path, current_depth + 1, max_scan_depth, results_list)
        except OSError:
            pass # Handle permission errors when listing subdirectories


def main():
    target_path = "."
    if len(sys.argv) > 1:
        target_path = sys.argv[1]
    else:
        user_input = input(f"Enter the base path to analyze (e.g., C:\\Users\\zakde\\ or C:\\). Press Enter for current directory ({os.getcwd()}): ")
        if user_input.strip() != "":
            target_path = user_input.strip()

    target_path = os.path.abspath(target_path)

    # Global list to collect all results (for potential final report/aggregation, though printed real-time)
    all_scanned_results = [] 
    
    # Check if the base path itself is an excluded directory at the very start
    is_base_path_excluded = False
    for exclude_path in EXCLUDE_DIRS:
        if target_path == exclude_path or target_path.startswith(exclude_path + os.sep):
            is_base_path_excluded = True
            break

    if is_base_path_excluded:
        result_entry = {
            "SELF_directory_path": target_path,
            "RESONANCE_status": "SKIPPED_EXCLUDED",
            "reason": "Base path is an excluded directory."
        }
        print(json.dumps(result_entry, indent=2))
        sys.exit(0)

    print("--- Starting bloatFinder scan ---")
    print(f"Base Path: {target_path}")
    print(f"Max scan depth: {MAX_SCAN_DEPTH} subdirectories down.")
    print(f"Excluded directories (from recursive scan): {len(EXCLUDE_DIRS)} entries")
    print("--------------------------------------------------------------------------------")

    # Start the recursive analysis
    analyze_directory_recursive(target_path, 0, MAX_SCAN_DEPTH, all_scanned_results)
    
    print("\n--- Scan Complete ---")
    print("--------------------------------------------------------------------------------")
    print("All results printed above as JSON objects.")
    print(f"Total directories processed (including skipped): {len(all_scanned_results)}")
    print("You can pipe output to a file: python bloatfinder.py \"C:\\Path\" > scan_log.json")


if __name__ == '__main__':
    main()