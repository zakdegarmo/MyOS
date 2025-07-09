import os
import re
import shutil

# --- DEWEY DECIMAL CLASSIFICATION KNOWLEDGE BASE ---
# This is a condensed version based on the index you provided.
# In a future module, this would be loaded from the external file.
DEWEY_INDEX = {
    "004": ["data", "processing", "debug", "computer science"],
    "005": ["script", "python", "javascript", "program", "code", "software", "algorithm"],
    "100": ["philosophy", "logic", "existence", "self", "ontology", "axiom"],
    "500": ["science", "math", "binary", "quantam", "physics"],
    "658": ["plan", "management", "objective", "workflow", "organization"],
    "700": ["the arts", "design", "architecture", "naming", "convention"]
}

def classify_content(content):
    """
    Analyzes the text content of an NLD to determine its Dewey Decimal Classification
    by scoring keyword matches against the DEWEY_INDEX.
    """
    content_lower = content.lower()
    scores = {key: 0 for key in DEWEY_INDEX}

    for key, keywords in DEWEY_INDEX.items():
        for keyword in keywords:
            scores[key] += len(re.findall(r'\b' + keyword + r'\b', content_lower))

    # Find the classification with the highest score
    if any(s > 0 for s in scores.values()):
        best_class = max(scores, key=scores.get)
        return best_class.zfill(4) # Pad with zeros, e.g., "5" -> "0005"
    
    # If no keywords match, it is unclassifiable and uses the 'n' quantifier
    return "0nnn"

def parse_nld_content(filepath):
    """Reads an NLD file and extracts key metadata."""
    metadata = {'title': 'Untitled'}
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            # Extract title using regex from the filename itself as a fallback
            base_name = os.path.basename(filepath)
            title_match = re.search(r' - (.*)\.md', base_name)
            if title_match:
                metadata['title'] = title_match.group(1).strip()
            metadata['content'] = content
    except Exception as e:
        print(f"  - Warning: Could not read {filepath}: {e}")
        return None, None
    return metadata, content

def main():
    """
    Recursively scans a user-specified directory for legacy NLDs, classifies them based on
    their content, and guides the user through a safe migration process.
    """
    target_dir = input("Please enter the full path of the directory you wish to scan and organize: ")

    if not os.path.isdir(target_dir):
        print(f"\nError: Directory not found at '{target_dir}'")
        return

    migrations_proposed = []
    print(f"\nScanning for legacy NLDs in '{target_dir}' and all subdirectories...")

    for root, _, files in os.walk(target_dir):
        for filename in files:
            if filename.startswith('NLD ') and not re.match(r'NLD \d{4}-\d{4}-\d{4}', filename):
                filepath = os.path.join(root, filename)
                metadata, content = parse_nld_content(filepath)
                if not metadata:
                    continue

                # Use the new intelligent classification function
                dewey_class_code = classify_content(content)
                
                # For now, BaseLogic and MyStack are universal (0000)
                new_name = f"NLD 0000-0000-{dewey_class_code} - {metadata['title']}.md"
                target_path = os.path.join(target_dir, dewey_class_code[:1] + "00") # Creates folders like /000, /100, /500 etc.

                migrations_proposed.append({
                    'old_path': filepath,
                    'new_path': os.path.join(target_path, new_name),
                    'target_dir': target_path
                })
    
    if not migrations_proposed:
        print("No legacy files found needing migration.")
        return

    print("\nThe following files have been intelligently classified for migration:")
    for item in migrations_proposed:
        print(f"  '{os.path.basename(item['old_path'])}'  >>  '{item['new_path']}'")

    copy_confirm = input(f"\nFound {len(migrations_proposed)} files to migrate. Proceed with creating new copies in target directories? (y/N): ")
    if copy_confirm.lower() != 'y':
        print("Operation cancelled.")
        return

    # Phase 1: Create Directories and Safe Copying
    for item in migrations_proposed:
        if not os.path.exists(item['target_dir']):
            create_dir_confirm = input(f"Target directory '{item['target_dir']}' does not exist. Create it? (y/N): ")
            if create_dir_confirm.lower() == 'y':
                os.makedirs(item['target_dir'])
                print(f"  - Directory created.")
            else:
                print(f"  - Skipping file '{os.path.basename(item['old_path'])}'...")
                continue
        
        try:
            shutil.copy2(item['old_path'], item['new_path'])
            print(f"  - Copied to '{item['new_path']}'")
        except Exception as e:
            print(f"  - ERROR copying '{os.path.basename(item['old_path'])}': {e}")
            
    print("\nMigration copy process complete. Please verify the new files.")
    delete_confirm = input("Delete the original legacy files? (y/N): ")

    if delete_confirm.lower() != 'y':
        print("Cleanup cancelled. Original files have been preserved.")
        return
        
    # Phase 2: Cleanup
    for item in migrations_proposed:
        try:
            os.remove(item['old_path'])
            print(f"  - Removed old file: '{item['old_path']}'")
        except Exception as e:
            print(f"  - ERROR removing '{item['old_path']}': {e}")

    print("\nArchive re-indexing is complete.")

if __name__ == '__main__':
    main()