import json
import datetime

# --- Configuration ---
FRAMEWORK_FILENAME = "MyOS_Knowledge_Graph.gguf.json"
ONTOLOGY_VERSION = "1.0 - Axiom of Mirrored Inversion"
CREATOR = "Architect-Primus"

def create_root_node():
    """
    Creates the foundational root node for the entire knowledge graph.
    This represents the origin point of the MyOS universe.
    """
    return {
        "coordinate": "0", # The ultimate root
        "type": "genesis_node",
        "name": "MyOS Root",
        "metadata": {
            "created_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "ontology_version": ONTOLOGY_VERSION,
            "creator": CREATOR
        },
        "nodes": [] # This list will hold all the top-level concepts
    }

def main():
    """
    Generates the 'empty container' for the MyOS knowledge graph.
    """
    print(f"Creating the foundational framework for MyOS...")
    
    # Create the main framework structure
    myos_framework = {
        "framework_version": "1.0",
        "description": "A self-indexing, 9-dimensional recursive knowledge graph.",
        "root": create_root_node()
    }

    # Write the framework to a file
    try:
        with open(FRAMEWORK_FILENAME, 'w', encoding='utf-8') as f:
            json.dump(myos_framework, f, indent=2)
        print(f"SUCCESS: Created '{FRAMEWORK_FILENAME}'.")
        print("This is the empty container for your universe. The next step is to populate it.")
    except Exception as e:
        print(f"ERROR: Could not create the framework file. Reason: {e}")

if __name__ == '__main__':
    main()