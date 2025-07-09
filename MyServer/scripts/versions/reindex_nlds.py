import os
import re

# The target directory containing the NLDs to be renamed.
# This should be run from the MyOS-MyServer root.
NLD_DIRECTORY = os.path.join('MyOSPlanning', 'MyOS_NLDs')

def get_legacy_nld_number(filename):
    """Parses old filenames to find their number."""
    match = re.search(r'NLD (\d{2,4})', filename)
    if match:
        return match.group(1).zfill(4) # Pad with zeros to 4 digits
    return None

def main():
    """
    Scans the NLD directory and proposes a migration to the new
    Dewey Matrix naming convention, then executes based on user confirmation.
    """
    if not os.path.isdir(NLD_DIRECTORY):
        print(f"Error: Directory not found at '{NLD_DIRECTORY}'")
        return

    files_to_rename = []
    for filename in os.listdir(NLD_DIRECTORY):
        if filename.startswith('NLD ') and '-' not in filename.split(' ')[1]:
            legacy_number = get_legacy_nld_number(filename)
            if legacy_number:
                # Simple mapping: Use legacy number as the primary identifier.
                # All others are set to 0000 for this initial migration.
                new_name = f"NLD {legacy_number}-0000-0000 - {filename.split(' - ')[-1]}"
                files_to_rename.append({'old': filename, 'new': new_name})

    if not files_to_rename:
        print("No legacy NLD files found to migrate.")
        return

    print("The following files will be COPIED to the new naming convention:")
    for item in files_to_rename:
        print(f"  '{item['old']}'  >>  '{item['new']}'")

    print(f"\nFound {len(files_to_rename)} files to be migrated in '{NLD_DIRECTORY}'.")
    copy_confirm = input("Proceed with creating new copies? (y/N): ")

    if copy_confirm.lower() != 'y':
        print("Operation cancelled by user.")
        return

    # Phase 1: Safe Copying
    for item in files_to_rename:
        old_path = os.path.join(NLD_DIRECTORY, item['old'])
        new_path = os.path.join(NLD_DIRECTORY, item['new'])
        try:
            with open(old_path, 'rb') as f_old, open(new_path, 'wb') as f_new:
                f_new.write(f_old.read())
            print(f"Successfully created copy: '{item['new']}'")
        except Exception as e:
            print(f"Error copying '{item['old']}': {e}")
            
    print("\nMigration complete. Please verify the new files.")
    delete_confirm = input("Delete the original legacy files? (y/N): ")

    if delete_confirm.lower() != 'y':
        print("Cleanup cancelled. Original files have been preserved.")
        return
        
    # Phase 2: Cleanup
    for item in files_to_rename:
        old_path = os.path.join(NLD_DIRECTORY, item['old'])
        try:
            os.remove(old_path)
            print(f"Successfully removed old file: '{item['old']}'")
        except Exception as e:
            print(f"Error removing '{item['old']}': {e}")

    print("\nArchive re-indexing is complete.")

if __name__ == '__main__':
    main()