# bulette_grubber.py - v3.1
# A targeted crawler that starts from a seed list of URLs.

import os
import time
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import re

# --- NEW: Use a specific list of starting points ---
SEED_URLS = [
    "https://entities.oclc.org/worldcat/ddc/E3F9hRv97HYyxWxcKvb6FFGm3y",
    "https://entities.oclc.org/worldcat/ddc/E3YGK3VqR9ghCwg3kDwfrXDTJ9",
    "https://entities.oclc.org/worldcat/ddc/E3QGtWm7RBHVmJyQgtqjCv8TXt",
    "https://entities.oclc.org/worldcat/ddc/E33pB9TRT8wPbpdhyXTBjmXWY4",
    "https://entities.oclc.org/worldcat/ddc/E3wxJ3BTJ68HcKRpy4MpH63b9J",
    "https://entities.oclc.org/worldcat/ddc/E43Gh6wpwVt8QhmBHgbxyfvpH8",
    "https://entities.oclc.org/worldcat/ddc/E48vcjGQpp8fBXfwMggX3MFhyp",
    "https://entities.oclc.org/worldcat/ddc/E3jVXD7f9YJFpxkXfyhXTQjQXV",
    "https://entities.oclc.org/worldcat/ddc/E3PK96PcYmPw6vwM4p8KxK4r3r",
    "https://entities.oclc.org/worldcat/ddc/E3XJ693tPgQQM7bhtXhgWVTVbb"
]

URL_INDEX_FILE = "oclc_concept_pages.txt"
POLITE_DELAY_SECONDS = 1.5

def main():
    urls_to_visit = SEED_URLS.copy() # Start with our seed list
    visited_urls = set()
    concept_page_urls = set()

    print(f"[Bulette]: Awakening. Beginning targeted crawl of {len(urls_to_visit)} seed URLs...")

    while urls_to_visit:
        current_url = urls_to_visit.pop(0)
        # Clean fragment identifiers (#) and query strings from the URL
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
                
                # --- Improved Filtering Logic ---
                if "oclc.org" not in urlparse(absolute_url).netloc or "login" in absolute_url or "#" in absolute_url:
                    continue
                
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