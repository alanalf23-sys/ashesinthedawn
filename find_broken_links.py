#!/usr/bin/env python3
"""
Find broken markdown links in the workspace.
Searches for patterns like [text](FILENAME.md) or [text](./FILENAME.md)
"""

import os
import re
from pathlib import Path
from collections import defaultdict

# Get workspace root
WORKSPACE_ROOT = Path("i:\\ashesinthedawn")

# Get all .md files (excluding node_modules, .venv, Codette/.venv, dist, .pytest_cache)
EXCLUDE_DIRS = {
    "node_modules",
    ".venv",
    "dist",
    ".pytest_cache",
    "__pycache__",
    ".github"
}

def get_all_md_files():
    """Get all markdown files, excluding certain directories"""
    md_files = set()
    for root, dirs, files in os.walk(WORKSPACE_ROOT):
        # Remove excluded directories
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        
        for file in files:
            if file.endswith(".md"):
                full_path = Path(root) / file
                relative_path = full_path.relative_to(WORKSPACE_ROOT)
                # Normalize to forward slashes
                normalized = str(relative_path).replace("\\", "/")
                md_files.add(normalized)
    
    return md_files

def find_links_in_file(file_path):
    """Find all markdown links in a file"""
    links = []
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            for line_num, line in enumerate(f, 1):
                # Match [text](path) patterns - both with and without ./
                matches = re.finditer(r'\[([^\]]+)\]\(([^)]+)\)', line)
                for match in matches:
                    text = match.group(1)
                    link_target = match.group(2)
                    
                    # Only process .md links, not URLs or other formats
                    if link_target.endswith('.md'):
                        # Remove leading ./ if present
                        clean_target = link_target.lstrip('./')
                        links.append({
                            'line': line_num,
                            'text': text,
                            'target': link_target,
                            'clean_target': clean_target
                        })
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
    
    return links

def main():
    """Main function to find broken links"""
    print("Building markdown file index...")
    all_md_files = get_all_md_files()
    print(f"Found {len(all_md_files)} markdown files\n")
    
    # Create a set of normalized file names for quick lookup
    normalized_files = {f.lower() for f in all_md_files}
    
    broken_links = []
    
    # Scan markdown files for links
    md_files_to_scan = [f for f in all_md_files if not any(
        excluded in f for excluded in ['node_modules', 'Codette', '.venv', 'dist', '.pytest_cache']
    )]
    
    print(f"Scanning {len(md_files_to_scan)} markdown files for broken links...\n")
    
    for md_file in md_files_to_scan:
        full_path = WORKSPACE_ROOT / md_file
        links = find_links_in_file(full_path)
        
        for link in links:
            target_lower = link['clean_target'].lower()
            
            # Check if the file exists (case-insensitive)
            exists = any(f.lower() == target_lower for f in all_md_files)
            
            if not exists:
                broken_links.append({
                    'source': md_file,
                    'line': link['line'],
                    'target': link['clean_target'],
                    'text': link['text'],
                    'status': 'BROKEN'
                })
    
    # Sort by source file and line number
    broken_links.sort(key=lambda x: (x['source'], x['line']))
    
    # Print results as markdown table
    if broken_links:
        print("## Broken Markdown Links Found\n")
        print("| Source File | Line # | Referenced File | Link Text |")
        print("|---|---|---|---|")
        
        for link in broken_links:
            source = link['source']
            line = link['line']
            target = link['target']
            text = link['text'][:50]  # Truncate long text
            
            print(f"| {source} | {line} | {target} | {text} |")
        
        print(f"\n**Total broken links found: {len(broken_links)}**")
    else:
        print("✓ No broken markdown links found!")

if __name__ == "__main__":
    main()
