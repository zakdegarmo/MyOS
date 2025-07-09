import os
import re
import shutil

def classify_content(content):
    """
    Analyzes the text content of an NLD to determine its Dewey Decimal Classification.
    This is the "AI" part of the script and the core of its logic.
    For now, it uses simple keyword matching. This can be evolved later.
    """
    content_lower = content.lower()
    if any(keyword in content_lower for keyword in ['schema', 'convention', 'format', 'standard']):
        return "005"  # DDC for Computer programming, programs, data
    if any(keyword in content_lower for keyword in ['plan', 'objective', 'phase']):
        return "658"  # DDC for General management
    if any(keyword in content_lower for keyword in ['debug', 'error', 'report']):
        return "004"  # DDC for Data processing & computer science
    # If no specific classification is found, it falls under the universal quantifier.
    return "0nn"

def parse_nld_content(filepath):
    """Reads an NLD file and extracts key metadata."""
    metadata = {'title': 'Untitled'}
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            # Extract title using regex
            title_match = re.search(r'Title: (.*)', content)
            if title_match:
                metadata['title'] = title_match.group(1).strip().replace('.md', '')
            metadata['content'] = content
    except Exception as e:
        print(f"  - Warning: Could not read {filepath}: {e}")
        return None, None
    return metadata, content

def main():
    """
    Recursively scans a user-specified directory for legacy NLDs, classifies them,
    and guides the user through a safe migration process.
    """
    # --- NEW: Prompt for user-specified directory ---
    target_dir = input("Please enter the full path of the directory you wish to scan and organize: ")

    if not os.path.isdir(target_dir):
        print(f"\nError: Directory not found at '{target_dir}'")
        return

    migrations_proposed = []
    print(f"\nScanning for legacy NLDs in '{target_dir}' and all subdirectories...")

    for root, _, files in os.walk(target_dir):
        for filename in files:
            # Smart filter: Find files that start with "NLD " but do not already match the new format.
            if filename.startswith('NLD ') and not re.match(r'NLD \d{4}-\d{4}-\d{4}', filename):
                filepath = os.path.join(root, filename)
                metadata, content = parse_nld_content(filepath)
                if not metadata:
                    continue

                dewey_class = classify_content(content)
                # For now, BaseLogic and MyStack are universal (0000)
                new_name = f"NLD 0000-0000-{dewey_class} - {metadata['title']}.md"
                
                # The target directory will be based on the broad DDC
                target_dir_name = f"{dewey_class[0]}00" 
                target_path = os.path.join(target_dir, target_dir_name)

                migrations_proposed.append({
                    'old_path': filepath,
                    'new_path': os.path.join(target_path, new_name),
                    'target_dir': target_path
                })

    if not migrations_proposed:
        print("No legacy files found needing migration.")
        return

    print("\nThe following files have been classified for migration:")
    for item in migrations_proposed:
        print(f"  '{os.path.basename(item['old_path'])}'  >>  '{os.path.basename(item['new_path'])}'")

    # --- NEW: First Confirmation Gate (Copy) ---
    copy_confirm = input(f"\nFound {len(migrations_proposed)} files to migrate. Proceed with creating new copies in target directories? (y/N): ")
    if copy_confirm.lower() != 'y':
        print("Operation cancelled.")
        return

    # Phase 1: Create Directories and Safe Copying
    for item in migrations_proposed:
        if not os.path.exists(item['target_dir']):
            print(f"  - Target directory '{item['target_dir']}' does not exist. Creating it now.")
            os.makedirs(item['target_dir'])
        
        try:
            shutil.copy2(item['old_path'], item['new_path'])
            print(f"  - Copied to '{item['new_path']}'")
        except Exception as e:
            print(f"  - ERROR copying '{os.path.basename(item['old_path'])}': {e}")
            
    # --- NEW: Second Confirmation Gate (Delete) ---
    print("\nMigration copy process complete. Please verify the new files in their new directories.")
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