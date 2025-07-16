import argparse
import sqlite3
import re
import shutil
import os
import csv
import datetime
import sys
from pathlib import Path

def get_file_summary(file_path: Path) -> str:
    """
    Creates a simple summary of a file's content for keyword matching.
    """
    summary = file_path.stem.replace('_', ' ').replace('-', ' ')
    
    # For code files, add the first bit of content to the summary
    if file_path.suffix.lower() in ['.py', '.js', '.c', '.cpp', '.h', '.hpp', '.md', '.txt', '.svg', '.ini', '.json']:
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content_sample = f.read(2048).lower()
                summary = f"{summary.lower()} {content_sample}"
        except Exception:
            # Errors reading content are handled by the caller, just return what we have.
            pass
            
    return summary

def find_best_dds_match(file_summary: str, dds_db_path: Path) -> tuple[str, str] | None:
    """
    Queries a SQLite DB of Dewey Decimal concepts to find the best match.
    Returns the DDS notation and the full folder name.
    """
    if not dds_db_path.is_file():
        # Errors are handled by the caller.
        return None

    conn = sqlite3.connect(dds_db_path)
    cursor = conn.cursor()

    keywords = set(re.split(r'[\s\.\,\(\)\[\]\{\}\'\"`_=\-<>/\\|;:]+', file_summary))
    best_match = None
    max_score = 0

    try:
        cursor.execute("SELECT name, summary FROM files")
        for name, dds_summary in cursor.fetchall():
            score = 0
            search_text = (name.lower() + " " + (dds_summary or ''))
            for keyword in keywords:
                if len(keyword) > 2 and keyword in search_text: # keyword length > 2
                    score += 1
            
            if score > max_score:
                max_score = score
                best_match = name
    except sqlite3.OperationalError:
        conn.close()
        return None

    conn.close()
    
    if best_match:
        match = re.match(r'^\s*([0-9X\s\-/\.]+)', best_match)
        if match:
            notation = match.group(1).strip()
            return notation, best_match

    return None

def get_target_path(notation: str, folder_name: str, root_path: Path) -> Path:
    """
    Creates the required nested directory for a given DDS notation and returns the path.
    """
    parts = notation.split('.')
    main_class = parts[0].split('-')[0].strip()

    path_parts = [root_path]
    if len(main_class) > 0: path_parts.append(main_class[0] + "00")
    if len(main_class) > 1: path_parts.append(main_class[0:2] + "0")
    if len(main_class) > 2: path_parts.append(main_class[0:3])

    return Path(os.path.join(*path_parts)) / folder_name


def main():
    parser = argparse.ArgumentParser(
        description="MELVIN's Mass Sorter: Intelligently sort a directory of artifacts into a Dewey Decimal structure.",
        formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument("source_dir", type=Path, help="The source directory of unsorted artifacts.")
    parser.add_argument("dds_db", type=Path, help="Path to the SQLite DB of Dewey Decimal concepts (e.g., 'C:\\MyOS\\int_libs\\MELVIN\\...\\dds_concepts.db').")
    parser.add_argument("dungeon_root", type=Path, help="The root path of the DDS 'dungeon' (e.g., 'MyOSPlanning/MyOS_NLDs/NLD 0000-0000-0000 DeweyDeciMatrix').")
    parser.add_argument(
        "--unsorted-dir", type=Path, default=None,
        help="Directory to place files that cannot be confidently categorized. Defaults to 'Unsorted' inside source_dir."
    )
    parser.add_argument(
        "--min-score", type=int, default=1,
        help="The minimum keyword match score required to categorize a file. Default is 1."
    )
    parser.add_argument(
        "--move", action="store_true",
        help="Move files instead of copying them. USE WITH CAUTION."
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Show what would be done without moving or creating anything."
    )
    args = parser.parse_args()

    if not args.source_dir.is_dir():
        print(f"ERROR: Source directory not found: {args.source_dir}")
        sys.exit(1)
    
    if not args.dds_db.is_file():
        print(f"ERROR: DDS database not found: {args.dds_db}")
        sys.exit(1)

    unsorted_path = args.unsorted_dir if args.unsorted_dir else (args.source_dir / "Unsorted")
    action = "Moving" if args.move else "Copying"

    # --- Reporting Setup ---
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    report_filename = args.source_dir / f"mass_sorter_report_{timestamp}.csv"
    report_file = open(report_filename, 'w', newline='', encoding='utf-8')
    report_writer = csv.writer(report_file)
    report_writer.writerow(["Source Path", "Status", "Destination / Reason"])

    print(f"--- MELVIN: Mass Sorter Initialized ---")
    print(f"Source:      {args.source_dir.resolve()}")
    print(f"Dungeon:     {args.dungeon_root.resolve()}")
    print(f"Unsorted to: {unsorted_path.resolve()}")
    print(f"Action:      {action}")
    print(f"Report will be saved to: {report_filename}")
    if args.dry_run:
        print("\n*** DRY RUN MODE: No files will be moved or copied. ***")

    if not args.dry_run:
        unsorted_path.mkdir(exist_ok=True)

    # --- Processing Loop ---
    all_files = [f for f in os.scandir(args.source_dir) if f.is_file()]
    total_files = len(all_files)
    sorted_count, unsorted_count, error_count = 0, 0, 0

    for i, item in enumerate(all_files):
        file_path = Path(item.path)
        sys.stdout.write(f"\rProcessing file {i+1}/{total_files}: {file_path.name}{' '*20}")
        sys.stdout.flush()

        summary = get_file_summary(file_path)
        if not summary:
            report_writer.writerow([str(file_path), "ERROR", "Could not generate summary"])
            error_count += 1
            continue

        match = find_best_dds_match(summary, args.dds_db)
        
        destination_file = None
        if not match or (match and match[0] < args.min_score):
            destination_file = unsorted_path / file_path.name
            status, reason = "UNSORTED", f"No category found with min score {args.min_score}"
            unsorted_count += 1
        else:
            dds_notation, dds_foldername = match
            target_path = get_target_path(dds_notation, dds_foldername, args.dungeon_root)
            destination_file = target_path / file_path.name
            status, reason = "SORTED", str(destination_file)
            sorted_count += 1

        if args.dry_run:
            report_writer.writerow([str(file_path), f"DRY RUN - {status}", reason])
            continue
        
        try:
            destination_file.parent.mkdir(parents=True, exist_ok=True)
            if args.move:
                shutil.move(str(file_path), str(destination_file))
            else:
                shutil.copy2(file_path, destination_file)
            report_writer.writerow([str(file_path), status, reason])
        except Exception as e:
            report_writer.writerow([str(file_path), "ERROR", str(e)])
            error_count += 1

    report_file.close()
    print(f"\n\n--- Mass Sorting Complete ---")
    print(f"  Sorted:   {sorted_count}")
    print(f"  Unsorted: {unsorted_count}")
    print(f"  Errors:   {error_count}")
    print(f"  Report saved to: {report_filename.resolve()}")


if __name__ == "__main__":
    main()