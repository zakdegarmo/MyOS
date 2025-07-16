import os
import argparse
from pathlib import Path

def create_component_structure(base_path: Path, branches: list[str], depth: int, current_depth: int = 0):
    """
    Recursively creates a component structure.
    """
    if current_depth >= depth:
        return

    for branch in branches:
        new_path = base_path / branch
        try:
            new_path.mkdir(parents=True, exist_ok=True)
            print(f"  Created: {new_path}")
            # If depth > 1, recurse into the new path
            if depth > 1:
                create_component_structure(new_path, branches, depth, current_depth + 1)
        except OSError as e:
            print(f"ERROR: Could not create directory '{new_path}'. Reason: {e}")

def main():
    parser = argparse.ArgumentParser(
        description="Scaffold a new component for MyOS using a fractal structure.",
        formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument(
        "path",
        type=str,
        help="The relative path for the new component from the project root (e.g., 'components/kernel/scheduler')."
    )
    parser.add_argument(
        "--branches",
        type=str,
        default="api,impl,test",
        help="A comma-separated list of subdirectories to create at each level.\nDefault: 'api,impl,test'"
    )
    parser.add_argument(
        "--depth",
        type=int,
        default=1,
        help="The recursive depth of the branch structure.\nDefault: 1 (creates one level of branches)."
    )
    parser.add_argument(
        "--project-root",
        type=str,
        default=Path(__file__).parent.parent, # Assumes script is in MyOS/tools/
        help="The root directory of the MyOS project."
    )

    args = parser.parse_args()

    component_path = Path(args.project_root) / args.path
    branch_names = [name.strip() for name in args.branches.split(',')]

    print(f"\nCreating component '{args.path}' at: {component_path.resolve()}")
    print(f"Structure template: {branch_names}")

    if component_path.exists() and any(component_path.iterdir()):
        confirm = input(f"Warning: Directory '{component_path}' already exists and is not empty. Continue? (y/N): ").lower()
        if confirm != 'y':
            print("Aborted by user.")
            return

    create_component_structure(component_path, branch_names, args.depth)

    print("\nComponent scaffolding complete.")

if __name__ == "__main__":
    main()