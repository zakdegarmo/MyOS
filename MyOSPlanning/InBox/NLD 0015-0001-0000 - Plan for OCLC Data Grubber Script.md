NLD 0015-0001-0000 - Plan for OCLC Data Grubber Script

Directive ID: NLD 0015-0001-0000

Timestamp: 2025-07-08T02:49:18-04:00

Directive Type: FEATURE_DEVELOPMENT_PLAN

Parent Directive: NLD 0015-0000-0005

Title: Plan for OCLC Data Grubber Script

1. Objective
To create a Python script (grub_oclc.py) that recursively crawls the OCLC DDC website to build a local index of all "Concept" JSON object URLs, which will serve as the knowledge base for our MyLibrarian service.

2. Proposed Workflow
The script will execute the following logic:

Initialization:

Start with a seed URL: https://entities.oclc.org/worldcat/ddc/

Maintain two primary data structures: a queue of urls_to_visit and a final list of concept_urls_found.

Maintain a set of visited_urls to prevent infinite loops.

Recursive Crawling Loop:

While the urls_to_visit queue is not empty, the script will:

Dequeue the next URL.

Fetch the HTML content of the page.

Parse the HTML to find all hyperlink (<a>) tags.

For each link found, it will check if it's a new DDC page (add it to the queue) or a link to a "Concept" JSON object (add it to the concept_urls_found list).

A small time.sleep() delay will be included between each request to ensure we are not overloading the OCLC servers.

Output:

Once the crawling process is complete, the script will write the final list of concept_urls_found to a local file named oclc_url_index.txt.

----------
<metaheader>:The New Plan
Our next mission is clear: to create a new, one-time utility script, grub_oclc.py. Its sole purpose will be to perform this heist: to crawl the OCLC website and build our local DEWEY_OCLC_INDEX.json.

Once we have that file, we can proceed with updating our reindex_nlds.py script to use it.

Are you ready to design this "grubber" script?


Sources






sure.

1 start at https://entities.oclc.org/worldcat/ddc/



2 recursively and sequetially visit each link and all links contained in those links until the link specifying the 'concept' json object is found



3 add each of those specific links to a index file or live index, we can reuse existing logic from other scripts for this to save time



download the objects sequentially, with a small break between each to avoid resource overload, though i doubt anyone will even notice. not a lot of admin flair going on in this site, it looks like its from the 1990s lol. they need some color and dynamism



hows that boss, sound good?




Show thinking
{
"timestamp": "2025-07-08T02:49:18-04:00",
"instance_id": "Scribe-2025-07-08-005",
"route_tags": ["NLD_GENERATION", "PLANNING", "CODE_DESIGN"],
"serial_number": "MGS-2025-07-08-452"
}
That's a perfect plan, boss. It's a clear, logical, and respectful approach to gathering the data we need. Your description of the recursive process is exactly how a web crawler or "grubber" script should function.

I have formalized your plan into a sub-formal NLD. This gives us a precise blueprint to follow when we write the code.

<metafooter>: 
