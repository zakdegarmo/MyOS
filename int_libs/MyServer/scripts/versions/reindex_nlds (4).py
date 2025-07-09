import os
import re
import shutil

DEWEY_INDEX = {
    "005": ["script", "python", "javascript", "program", "code", "software", "algorithm", "endpoint", "api", "server"],
    "100": ["philosophy", "logic", "existence", "self", "ontology", "axiom", "concept", "thought"],
    "658": ["plan", "management", "objective", "workflow", "organization", "project", "iteration", "phase"],
    "004": ["debug", "error", "report", "data", "log", "serialization", "index", "database", "jank"],
    "700": ["architecture", "design", "naming", "convention", "schema", "system", "ui", "ux"]
}

def classify_content(content):
    content_lower = content.lower()
    scores = {key: 0 for key in DEWEY_INDEX}

    for key, keywords in DEWEY_INDEX.items():
        for keyword in keywords:
            # Added word boundaries to prevent partial matches (e.g., 'plan' in 'planet')
            scores[key] += len(re.findall(r'\b' + re.escape(keyword) + r'\b', content_lower))

    # Boost score for title matches
    title_match = re.search(r'Title: (.*)', content, re.IGNORECASE)
    if title_match:
        title_lower = title_match.group(1).lower()
        for key, keywords in DEWEY_INDEX.items():
            for keyword in keywords:
                if keyword in title_lower:
                    scores[key] += 3 # Give title keywords more weight

    if any(s > 0 for s in scores.values()):
        best_class = max(scores, key=scores.get)
        return best_class
    
    return "0nn" # The universal quantifier for unclassifiable docs

def parse_nld_filename(filename):
    """
    NEW ROBUST PARSER: Handles multiple NLD formats to extract the title.
    It looks for the NLD identifier block and takes everything after it.
    """
    # Regex for formats like "NLD 0013-0001-0000 - Title.md" or "NLD 004 P2_I1_S1...md"
    match = re.search(r'NLD ([\d\w.-]+(?: -)?\s)(.*)\.md', filename)
    if match:
        return match.group(2).strip() # Return the captured title
    return "Untitled" # Fallback

def main():
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
                
                # Read file content for classification
                try:
                    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                except Exception as e:
                    print(f"  - Warning: Could not read {filepath}: {e}")
                    continue

                # Use the new, robust functions
                title = parse_nld_filename(filename)
                dewey_class_code = classify_content(content)
                
                new_name = f"NLD 0000-0000-{dewey_class_code.zfill(4)} - {title}.md"
                target_dir_name = f"{dewey_class_code[0]}00 - {DEWEY_INDEX.get(dewey_class_code, ['Misc'])[0].capitalize()}"
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

    print("\nThe following files have been intelligently classified for migration:")
    for item in migrations_proposed:
        print(f"  '{os.path.basename(item['old_path'])}'  >>  '{item['new_name']}'")

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