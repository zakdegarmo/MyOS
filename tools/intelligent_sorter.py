import argparse
import sqlite3
import re
import shutil
import os
from pathlib import Path

def get_file_summary(file_path: Path) -> str:
    """
    Creates a simple summary of a file's content for keyword matching.
    """
    summary = file_path.stem.replace('_', ' ').replace('-', ' ')
    
    # For code files, add the first bit of content to the summary
    if file_path.suffix in ['.py', '.js', '.c', '.cpp', '.h', '.hpp', '.md', '.txt']:
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                # Add filename and first 1KB of content for better matching
                content_sample = f.read(1024).lower()
                summary = f"{summary.lower()} {content_sample}"
        except Exception as e:
            print(f"  > Info: Could not read content from {file_path.name}: {e}")
            
    return summary

def find_best_dds_match(file_summary: str, dds_db_path: Path) -> tuple[str, str] | None:
    """
    Queries a SQLite DB of Dewey Decimal concepts to find the best match for a file summary.
    Returns the DDS notation and the full folder name.
    """
    if not dds_db_path.is_file():
        print(f"ERROR: DDS database not found at '{dds_db_path.resolve()}'")
        print("Please run 'catalog_files.py' on your 'Dewey_Concepts_JSON' directory first.")
        return None

    conn = sqlite3.connect(dds_db_path)
    cursor = conn.cursor()

    keywords = set(re.split(r'[\s\.\,\(\)\[\]\{\}\'\"`_=\-<>/\\]+', file_summary))
    best_match = None
    max_score = 0

    try:
        cursor.execute("SELECT name, summary FROM files") # Assumes table 'files' from catalog_files.py
        for name, dds_summary in cursor.fetchall():
            score = 0
            search_text = (name.lower() + " " + (dds_summary or ''))
            for keyword in keywords:
                if len(keyword) > 3 and keyword in search_text:
                    score += 1
            
            if score > max_score:
                max_score = score
                best_match = name
    except sqlite3.OperationalError:
        print(f"ERROR: Query failed on '{dds_db_path.resolve()}'.")
        print("Ensure the DB was created by 'catalog_files.py' and has 'name' and 'summary' columns.")
        conn.close()
        return None

    conn.close()
    
    if best_match:
        # Extract notation from the folder name, e.g., "513 - Arithmetic" -> "513"
        match = re.match(r'^\s*([0-9X\s\-/\.]+)', best_match)
        if match:
            notation = match.group(1).strip()
            return notation, best_match

    return None

def create_and_get_target_path(notation: str, folder_name: str, root_path: Path, dry_run: bool) -> Path | None:
    """
    Creates the required nested directory for a given DDS notation and returns the path.
    """
    parts = notation.split('.')
    main_class = parts[0].split('-')[0].strip()

    path_parts = [root_path]
    if len(main_class) > 0: path_parts.append(main_class[0] + "00")
    if len(main_class) > 1: path_parts.append(main_class[0:2] + "0")
    if len(main_class) > 2: path_parts.append(main_class[0:3])

    # Create the full path including the final descriptive folder
    target_dir = Path(os.path.join(*path_parts)) / folder_name

    if dry_run:
        print(f"[DRY RUN] Would ensure directory exists: {target_dir}")
    else:
        try:
            target_dir.mkdir(parents=True, exist_ok=True)
        except OSError as e:
            print(f"ERROR: Could not create directory '{target_dir}'. Reason: {e}")
            return None
    return target_dir

def main():
    parser = argparse.ArgumentParser(
        description="Intelligently sort a file into a Dewey Decimal structure by creating the minimal required path.",
        formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument("source_file", type=Path, help="The path to the source file (artifact) to be sorted.")
    parser.add_argument("dds_db", type=Path, help="Path to the SQLite database of cataloged Dewey Decimal concepts.")
    parser.add_argument("dungeon_root", type=Path, help="The root path of the DDS 'dungeon' (e.g., 'MyOSPlanning/MyOS_NLDs/NLD 0000-0000-0000 DeweyDeciMatrix').")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be done without moving or creating anything.")
    args = parser.parse_args()

    print(f"--- MELVIN: Intelligent Sorter Initialized ---")
    print(f"Analyzing artifact: {args.source_file.name}")

    # 1. Analyze the artifact to get a keyword summary
    summary = get_file_summary(args.source_file)
    if not summary:
        print("Could not generate a summary for the source file. Aborting.")
        return

    # 2. Find the best matching DDS concept from the database
    print(f"Searching for a home in: {args.dds_db.name}")
    match = find_best_dds_match(summary, args.dds_db)
    if not match:
        print("Could not find a suitable DDS category for this artifact. It may need to be sorted manually.")
        return
    
    dds_notation, dds_foldername = match
    print(f"Best match found: '{dds_foldername}' (Notation: {dds_notation})")

    # 3. Create the minimal fractal path for the concept
    target_path = create_and_get_target_path(dds_notation, dds_foldername, args.dungeon_root, args.dry_run)
    if not target_path:
        print("Failed to create the directory path. Aborting file placement.")
        return

    # 4. Place the file into the newly created (or already existing) directory
    destination_file = target_path / args.source_file.name
    print(f"\nPlacing artifact '{args.source_file.name}' into '{target_path}'")
    if args.dry_run:
        print(f"[DRY RUN] Would copy '{args.source_file}' to '{destination_file}'")
    else:
        shutil.copy2(args.source_file, destination_file)
        print(f"\nSuccessfully sorted artifact to: {destination_file.resolve()}")

if __name__ == "__main__":
    main()