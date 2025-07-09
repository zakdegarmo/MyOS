import os
import re
import shutil

# --- DEWEY DECIMAL CLASSIFICATION KNOWLEDGE BASE ---
DEWEY_INDEX = {
    "005": ["script", "python", "javascript", "program", "code", "software", "algorithm", "endpoint", "api", "server"],
    "100": ["philosophy", "logic", "existence", "self", "ontology", "axiom", "concept", "thought"],
    "658": ["plan", "management", "objective", "workflow", "organization", "project", "iteration", "phase"],
    "004": ["debug", "error", "report", "data", "log", "serialization", "index", "database", "jank"],
    "700": ["architecture", "design", "naming", "convention", "schema", "system", "ui", "ux"]
}

# --- Modular Classification Functions ---

def get_base_logic_value(content):
    """Determines the BaseLogic identifier. Placeholder for now."""
    # For now, we assume all legacy files are foundational.
    return "0000"

def get_dewey_matrix_value(content):
    """Determines the MyStack/DeweyMatrix identifier. Placeholder for now."""
    # For now, we assume they apply to the universal stack.
    return "0000"

def get_dewey_class_value(content):
    """
    Analyzes content to determine its Dewey Decimal Classification.
    This is our "MyLibrarian" module.
    """
    content_lower = content.lower()
    scores = {key: 0 for key in DEWEY_INDEX}
    for key, keywords in DEWEY_INDEX.items():
        for keyword in keywords:
            scores[key] += len(re.findall(r'\b' + re.escape(keyword) + r'\b', content_lower))

    # Give title keywords more weight for better accuracy
    title_match = re.search(r'Title: (.*)', content, re.IGNORECASE)
    if title_match:
        title_lower = title_match.group(1).lower()
        for key, keywords in DEWEY_INDEX.items():
            if any(keyword in title_lower for keyword in keywords):
                scores[key] += 3

    if any(s > 0 for s in scores.values()):
        return max(scores, key=scores.get).zfill(4)
    
    return "0nnn"

def parse_title_from_filename(filename):
    """A robust parser to extract the title from various legacy filename formats."""
    match = re.search(r'NLD ([\d\w.-]+(?: -)?\s)(.*)\.md', filename)
    if match:
        return match.group(2).strip()
    return "Untitled"

def main():
    target_dir = input("Please enter the full path of the directory to scan: ")
    if not os.path.isdir(target_dir):
        print(f"\nError: Directory not found at '{target_dir}'")
        return

    migrations_proposed = []
    print(f"\nScanning for legacy NLDs in '{target_dir}'...")

    for root, _, files in os.walk(target_dir):
        for filename in files:
            if filename.startswith('NLD ') and not re.match(r'NLD \d{4}-\d{4}-\d{4}', filename):
                filepath = os.path.join(root, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                except Exception as e:
                    print(f"  - Warning: Could not read {filepath}: {e}")
                    continue

                # --- Use the new modular functions ---
                data_points = {
                    "BaseLogicValue": get_base_logic_value(content),
                    "DeweyMatrixValue": get_dewey_matrix_value(content),
                    "DeweyClassValue": get_dewey_class_value(content),
                    "title": parse_title_from_filename(filename)
                }
                
                new_name = f"NLD {data_points['BaseLogicValue']}-{data_points['DeweyMatrixValue']}-{data_points['DeweyClassValue']} - {data_points['title']}.md"
                target_dir_name = f"{data_points['DeweyClassValue'][:1]}00 - {DEWEY_INDEX.get(data_points['DeweyClassValue'], ['Misc'])[0].capitalize()}"
                target_path = os.path.join(target_dir, target_dir_name)

                migrations_proposed.append({
                    'old_path': filepath,
                    'new_path': os.path.join(target_path, new_name),
                    'target_dir': target_path,
                    'new_name': new_name
                })
    
    if not migrations_proposed:
        print("No legacy files found needing migration.")
        return

    # The rest of the script (user confirmation gates and file operations) remains the same...

    print("\nThe following files have been intelligently classified for migration:")
    for item in migrations_proposed:
        print(f"  '{os.path.basename(item['old_path'])}'  >>  '{item['new_name']}'")

    copy_confirm = input(f"\nFound {len(migrations_proposed)} files to migrate. Proceed with creating new copies? (y/N): ")
    if copy_confirm.lower() != 'y':
        print("Operation cancelled.")
        return

    for item in migrations_proposed:
        if not os.path.exists(item['target_dir']):
            # Simplified for now: auto-create directories
            os.makedirs(item['target_dir'])
            print(f"  - Directory created: {item['target_dir']}")
        try:
            shutil.copy2(item['old_path'], item['new_path'])
            print(f"  - Copied to '{item['new_path']}'")
        except Exception as e:
            print(f"  - ERROR copying '{os.path.basename(item['old_path'])}': {e}")
            
    print("\nMigration copy process complete.")
    delete_confirm = input("Delete the original legacy files? (y/N): ")
    if delete_confirm.lower() != 'y':
        print("Cleanup cancelled.")
        return
        
    for item in migrations_proposed:
        try:
            os.remove(item['old_path'])
            print(f"  - Removed old file: '{item['old_path']}'")
        except Exception as e:
            print(f"  - ERROR removing '{item['old_path']}': {e}")

    print("\nArchive re-indexing is complete.")


if __name__ == '__main__':
    main()