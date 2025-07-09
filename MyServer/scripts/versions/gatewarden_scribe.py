# gatewarden_scribe.py - v1.0
# Reads an index of URLs and downloads the corresponding JSON concepts.

import os
import time
import requests
import json
from urllib.parse import urljoin, urlparse

# --- Configuration ---
# This file should be created by bulette_grubber.py
URL_INDEX_FILE = "oclc_concept_pages.txt" 
OUTPUT_DIR = "Dewey_Concepts_JSON"      # The folder where the final JSON files will be saved
POLITE_DELAY_SECONDS = 1.0               # A respectful delay between requests

def download_concepts_from_index(url_list, output_dir):
    """
    Reads the URL list, constructs the direct download link for each,
    and saves the JSON content to a local file.
    """
    print(f"\n[Gatewarden]: Awakening. Beginning download of {len(url_list)} concepts...")
    if not os.path.exists(output_dir):
        print(f"[Gatewarden]: Creating output directory: {output_dir}")
        os.makedirs(output_dir)

    success_count = 0
    fail_count = 0
    for url in url_list:
        try:
            # Clean the URL to ensure it's just the base path
            clean_url = url.strip()
            print(f"[Gatewarden]: Processing page: {clean_url}")

            # Construct the direct download URL based on the known pattern
            json_url = clean_url + ".jsonld?download=true"
            
            print(f"  [>] Requesting: {json_url}")
            json_response = requests.get(json_url, timeout=15)
            json_response.raise_for_status()
            json_data = json_response.json()
            
            # Use the Dewey 'notation' for a clean, logical filename
            # Replace spaces and slashes in notation to create a valid filename
            notation = json_data.get('notation', 'UNKNOWN')
            safe_notation = notation.replace(' ', '_').replace('/', '_')
            filename = f"{safe_notation}.json"
            filepath = os.path.join(output_dir, filename)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(json_data, f, ensure_ascii=False, indent=2)
            print(f"  [+] Inscribed concept to '{filepath}'")
            success_count += 1

            time.sleep(POLITE_DELAY_SECONDS)

        except Exception as e:
            print(f"  [!] Gatewarden ERROR: Could not process {url}: {e}")
            fail_count += 1
            continue
            
    print("\n-------------------------------------------")
    print("[Gatewarden]: Inscription complete.")
    print(f"  > Successfully downloaded: {success_count} concepts.")
    print(f"  > Failed to download: {fail_count} concepts.")
    print(f"  > All data saved in '{output_dir}' directory.")
    print("-------------------------------------------")


def main():
    """Orchestrates the download process."""
    if not os.path.exists(URL_INDEX_FILE):
        print(f"Error: URL index file '{URL_INDEX_FILE}' not found.")
        print("Please run the 'bulette_grubber.py' script first to generate the list of URLs.")
        return
        
    with open(URL_INDEX_FILE, 'r', encoding='utf-8') as f:
        concept_pages = [line.strip() for line in f if line.strip()]
        
    if not concept_pages:
        print("URL index file is empty. Nothing to download.")
        return

    download_concepts_from_index(concept_pages, OUTPUT_DIR)

if __name__ == '__main__':
    main()