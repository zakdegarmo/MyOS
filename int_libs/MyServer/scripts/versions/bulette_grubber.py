# bulette_grubber.py - v3.0
# A more intelligent crawler that follows all internal links to find concept pages.

import os
import time
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import re

# --- Configuration ---
START_URL = "https://entities.oclc.org/worldcat/ddc/"
URL_INDEX_FILE = "oclc_concept_pages.txt"
POLITE_DELAY_SECONDS = 1.5

def main():
    urls_to_visit = [START_URL]
    visited_urls = set()
    concept_page_urls = set()

    print(f"[Bulette]: Awakening. Target: {START_URL}")

    while urls_to_visit:
        current_url = urls_to_visit.pop(0)
        # Clean fragment identifiers (#) from the URL
        current_url = urljoin(current_url, urlparse(current_url).path)
        if current_url in visited_urls:
            continue

        print(f"[Bulette]: Burrowing into: {current_url}")
        visited_urls.add(current_url)

        try:
            response = requests.get(current_url, timeout=15)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')

            for link in soup.find_all('a', href=True):
                absolute_url = urljoin(current_url, link['href'])
                
                # Only stay within the OCLC domain
                if "oclc.org" not in urlparse(absolute_url).netloc:
                    continue
                
                # Clean the URL
                clean_url = urljoin(absolute_url, urlparse(absolute_url).path)

                # The unique pattern for a concept page URL contains "/worldcat/ddc/E"
                if "/worldcat/ddc/E" in clean_url:
                    if clean_url not in concept_page_urls:
                        print(f"  [+] Uncovered Concept Page: {clean_url}")
                        concept_page_urls.add(clean_url)
                
                # Any other relevant page on the site that we haven't visited yet
                elif "/worldcat/ddc/" in clean_url and clean_url not in visited_urls:
                    if clean_url not in urls_to_visit:
                         urls_to_visit.append(clean_url)
            
            time.sleep(POLITE_DELAY_SECONDS)

        except requests.RequestException as e:
            print(f"  [!] Bulette hit a rock at {current_url}: {e}")
            continue
            
    sorted_urls = sorted(list(concept_page_urls))
    with open(URL_INDEX_FILE, 'w', encoding='utf-8') as f:
        for url in sorted_urls:
            f.write(url + '\n')
            
    print(f"\n[Bulette]: Task complete. Found {len(sorted_urls)} unique concept pages.")
    print(f"Index of pages saved to '{URL_INDEX_FILE}'.")

if __name__ == '__main__':
    main()