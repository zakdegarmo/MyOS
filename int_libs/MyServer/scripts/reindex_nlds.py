import os
import re
import shutil
import json

# --- DEWEY DECIMAL KNOWLEDGE BASE (v2 - Complete Top-Level) ---
# This version includes all 10 primary classes for accurate foundational mapping.
DEWEY_INDEX = {
    "000": ["generalities", "computer science", "information", "systems", "data", "index", "cyber", "library"],
    "100": ["philosophy", "psychology", "ontology", "existence", "self", "thought", "logic", "axiom", "metaphysics"],
    "200": ["religion", "mythology", "theology", "god", "deity"],
    "300": ["social sciences", "community", "collaboration", "team", "humanity", "politics", "economics", "law"],
    "400": ["language", "linguistics", "naming", "convention", "syntax", "grammar", "words"],
    "500": ["science", "mathematics", "binary", "quantum", "physics", "astronomy", "chemistry", "biology"],
    "600": ["technology", "applied sciences", "server", "api", "script", "code", "software", "program", "engineering"],
    "700": ["arts", "recreation", "design", "architecture", "ui", "ux", "schema", "structure", "folder", "music", "painting"],
    "800": ["literature", "rhetoric", "story", "narrative", "fiction", "poetry", "prose"],
    "900": ["history", "geography", "biography", "plan", "roadmap", "report", "civilization", "archaeology"]
}
DEWEY_LABELS = {
    "000": "000 - Computer science, information & general works",
    "100": "100 - Philosophy & psychology",
    "200": "200 - Religion",
    "300": "300 - Social sciences",
    "400": "400 - Language",
    "500": "500 - Science",
    "600": "600 - Technology",
    "700": "700 - Arts & recreation",
    "800": "800 - Literature",
    "900": "900 - History & geography"
}

def classify_content(content, filename):
    """
    Analyzes content AND filename to determine its Dewey Decimal Classification
    by scoring keyword matches against the DEWEY_INDEX.
    """
    content_lower = content.lower()
    filename_lower = filename.lower()
    scores = {key: 0 for key in DEWEY_INDEX}

    for key, keywords in DEWEY_INDEX.items():
        # Score based on content
        for keyword in keywords:
            scores[key] += len(re.findall(r'\b' + re.escape(keyword) + r'\b', content_lower))
        
        # Give filename keywords more weight
        if any(keyword in filename_lower for keyword in keywords):
            scores[key] += 5

    if any(s > 0 for s in scores.values()):
        best_class = max(scores, key=scores.get)
        return best_class
    
    return "000" # Default to Generalities if no match

def parse_title_from_filename(filename):
    """A robust parser to extract the title from various legacy filename formats."""
    match = re.search(r'NLD (?:[\d\w.-]+(?: -)?\s*)(.*)\.md', filename, re.IGNORECASE)
    if match:
        return match.group(1).strip().replace('.md', '')
    return os.path.splitext(filename)[0]

def main():
    target_dir = input("Please enter the full path of the directory you wish to scan and organize: ")
    if not os.path.isdir(target_dir):
        print(f"\nError: Directory not found at '{target_dir}'")
        return

    migrations_proposed = []
    print(f"\nScanning for legacy NLDs in '{target_dir}' and all subdirectories...")

    for root, _, files in os.walk(target_dir):
        for filename in files:
            if filename.upper().startswith('NLD ') and not re.match(r'NLD \d{4}-\d{4}-\d{4}', filename):
                filepath = os.path.join(root, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                except Exception as e:
                    print(f"  - Warning: Could not read {filepath}: {e}")
                    continue

                title = parse_title_from_filename(filename)
                dewey_class_code = classify_content(content, filename)
                
                new_name = f"NLD 0000-0000-{dewey_class_code.zfill(4)} - {title}.md"
                target_dir_name = f"{dewey_class_code} - {DEWEY_LABELS.get(dewey_class_code, 'Miscellaneous')}"
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

    copy_confirm = input(f"\nFound {len(migrations_proposed)} files to migrate. Proceed with creating new directories and copies? (Y/N): ")
    if copy_confirm.lower() != 'y':
        print("Operation cancelled.")
        return

    for item in migrations_proposed:
        if not os.path.exists(item['target_dir']):
            os.makedirs(item['target_dir'])
            print(f"  - Directory created: {item['target_dir']}")
        try:
            shutil.copy2(item['old_path'], item['new_path'])
            print(f"  - Copied to '{item['new_path']}'")
        except Exception as e:
            print(f"  - ERROR copying '{os.path.basename(item['old_path'])}': {e}")
            
    print("\nMigration copy process complete.")
    delete_confirm = input("Delete the original legacy files? (Y/N): ")
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