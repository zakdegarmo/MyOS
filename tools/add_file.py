import argparse
import json
import shutil
from pathlib import Path

# Default mapping of file extensions to component subdirectories.
# Users can override this with a command-line argument.
DEFAULT_EXTENSION_MAP = {
    ".py": "impl",
    ".c": "impl",
    ".cpp": "impl",
    ".js": "impl",
    ".ts": "impl",
    ".h": "api",
    ".hpp": "api",
    ".h++": "api",
    ".pyi": "api",
    ".md": "docs",
    ".txt": "docs",
    ".svg": "assets",
    ".png": "assets",
    ".jpg": "assets",
    ".jpeg": "assets",
    # Special case for test files, checked before simple extensions
    ".test.py": "test",
    ".test.js": "test",
}

def add_file_to_component(
    project_root: Path,
    source_file: Path,
    component_rel_path: str,
    extension_map: dict[str, str],
    dry_run: bool = False,
):
    """
    Adds a local file to a component subdirectory based on its extension.

    Args:
        project_root: The root path of the project.
        source_file: The path to the file to be added.
        component_rel_path: The relative path to the component directory.
        extension_map: A dictionary mapping file extensions to subdirectories.
        dry_run: If True, prints what would be done without actually copying.
    """
    if not source_file.is_file():
        print(f"ERROR: Source file not found at '{source_file.resolve()}'")
        return

    # Find the matching subdirectory for the file extension
    target_subdir = None
    # Check for compound extensions first (e.g., .test.py) to ensure they are prioritized
    for ext, subdir in sorted(extension_map.items(), key=lambda x: len(x[0]), reverse=True):
        if source_file.name.endswith(ext):
            target_subdir = subdir
            break

    if not target_subdir:
        print(f"ERROR: No subdirectory mapping found for extension '{''.join(source_file.suffixes)}'.")
        print("Please update the extension map in the script or provide one via --ext-map.")
        return

    # Construct the full destination path
    destination_dir = project_root / component_rel_path / target_subdir
    destination_file = destination_dir / source_file.name

    print(f"\nSource:      {source_file.resolve()}")
    print(f"Destination: {destination_file.resolve()}")

    if destination_file.exists():
        print("Warning: Destination file already exists. It will be overwritten.")

    if dry_run:
        print("\n[DRY RUN] Would perform the following actions:")
        if not destination_dir.exists():
            print(f"[DRY RUN] Would create directory: {destination_dir}")
        print(f"[DRY RUN] Would copy '{source_file}' to '{destination_file}'")
        return

    try:
        destination_dir.mkdir(parents=True, exist_ok=True)
        print(f"\nEnsured directory exists: {destination_dir}")

        shutil.copy2(source_file, destination_file)
        print(f"Successfully copied file to {destination_file}")
    except OSError as e:
        print(f"ERROR: Could not create directory or copy file. Reason: {e}")
    except shutil.SameFileError:
        print("ERROR: Source and destination are the same file.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

def main():
    parser = argparse.ArgumentParser(
        description="Add a local file to a MyOS component, placing it in a subdirectory based on its extension.",
        formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument("source_path", type=str, help="The path to the local file you want to add.")
    parser.add_argument("component_path", type=str, help="The relative path for the target component (e.g., 'components/kernel/scheduler').")
    parser.add_argument(
        "--ext-map", type=str, help="A JSON string mapping file extensions to subdirectory names.\nExample: '{\".py\": \"impl\", \".md\": \"docs\"}'"
    )
    parser.add_argument(
        "--project-root", type=str, default=Path(__file__).parent.parent, help="The root directory of the MyOS project."
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="Show what would be done without actually copying any files."
    )

    args = parser.parse_args()

    extension_map = DEFAULT_EXTENSION_MAP
    if args.ext_map:
        try:
            extension_map.update(json.loads(args.ext_map))
        except json.JSONDecodeError as e:
            print(f"ERROR: Invalid JSON in --ext-map argument: {e}")
            return

    add_file_to_component(Path(args.project_root), Path(args.source_path), args.component_path, extension_map, args.dry_run)

if __name__ == "__main__":
    main()