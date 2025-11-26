#!/usr/bin/env python3
"""
Codette GitHub Batch Commit Manager
Automates file additions to git in batches of ~100 files

Usage: python manage_codette_github.py
"""

import os
import subprocess
import sys
from pathlib import Path
from typing import List, Tuple

BATCH_SIZE = 100
CODETTE_PATH = Path("Codette")
GIT_REPO = Path(".git")


def get_untracked_files() -> List[Path]:
    """Get list of untracked files in Codette folder."""
    try:
        result = subprocess.run(
            ["git", "ls-files", "--others", "--exclude-standard"],
            capture_output=True,
            text=True,
            timeout=30,
        )
        if result.returncode == 0:
            files = [Path(f) for f in result.stdout.strip().split("\n") if f]
            return files
        return []
    except Exception as e:
        print(f"❌ Error getting untracked files: {e}")
        return []


def get_file_size_mb(file_path: Path) -> float:
    """Get file size in MB."""
    try:
        return file_path.stat().st_size / (1024 * 1024)
    except:
        return 0.0


def filter_large_files(files: List[Path], max_size_mb: float = 100) -> Tuple[List[Path], List[Path]]:
    """Separate files by size, excluding files larger than max_size_mb."""
    small_files = []
    large_files = []

    for file_path in files:
        size_mb = get_file_size_mb(file_path)
        if size_mb > max_size_mb:
            large_files.append(file_path)
            print(f"  ⚠️  SKIP (too large {size_mb:.1f}MB): {file_path}")
        elif size_mb > 10:
            print(f"  ⚠️  WARN (large {size_mb:.1f}MB): {file_path}")
            small_files.append(file_path)
        else:
            small_files.append(file_path)

    return small_files, large_files


def batch_add_and_commit(files: List[Path], batch_num: int) -> bool:
    """Add and commit a batch of files."""
    if not files:
        print(f"  ℹ️  Batch {batch_num}: No files to process")
        return True

    print(f"\n📦 BATCH {batch_num}: {len(files)} files")
    print("-" * 70)

    # Git add
    try:
        subprocess.run(
            ["git", "add"] + [str(f) for f in files],
            check=True,
            capture_output=True,
            timeout=60,
        )
        print(f"  ✅ Added {len(files)} files to staging")
    except subprocess.CalledProcessError as e:
        print(f"  ❌ Git add failed: {e}")
        return False

    # Git commit
    try:
        commit_msg = f"Add batch {batch_num}: {len(files)} Codette files (batch commit {batch_num})"
        subprocess.run(
            ["git", "commit", "-m", commit_msg],
            check=True,
            capture_output=True,
            timeout=60,
        )
        print(f"  ✅ Committed batch {batch_num}")
        return True
    except subprocess.CalledProcessError as e:
        if b"nothing to commit" in e.stderr or b"no changes added" in e.stderr:
            print(f"  ℹ️  Nothing to commit in batch {batch_num}")
            return True
        print(f"  ❌ Git commit failed: {e}")
        return False


def push_to_github() -> bool:
    """Push commits to GitHub."""
    print("\n🚀 PUSH TO GITHUB")
    print("-" * 70)

    try:
        result = subprocess.run(
            ["git", "push", "-u", "origin", "main"],
            capture_output=True,
            text=True,
            timeout=120,
        )

        if result.returncode == 0:
            print("  ✅ Successfully pushed to GitHub")
            return True
        else:
            print(f"  ⚠️  Push warning/error: {result.stderr[:200]}")
            return False
    except Exception as e:
        print(f"  ❌ Push failed: {e}")
        return False


def main():
    """Main batch commit process."""
    print("=" * 70)
    print("CODETTE GITHUB BATCH COMMIT MANAGER")
    print("=" * 70)

    # Check git repo
    if not GIT_REPO.exists():
        print("❌ Not a git repository. Run from repo root.")
        return 1

    # Get untracked files
    print("\n📋 SCANNING FOR UNTRACKED FILES")
    print("-" * 70)
    all_files = get_untracked_files()
    print(f"  Found {len(all_files)} untracked files")

    if not all_files:
        print("  ℹ️  No untracked files to process")
        return 0

    # Filter large files
    print("\n🔍 FILTERING FILES BY SIZE")
    print("-" * 70)
    small_files, large_files = filter_large_files(all_files, max_size_mb=100)
    print(f"  ✅ {len(small_files)} files OK (<100MB)")
    print(f"  ⚠️  {len(large_files)} files skipped (>100MB)")

    if not small_files:
        print("\n❌ No eligible files to process")
        return 1

    # Process batches
    print("\n⚙️  PROCESSING BATCHES")
    print("=" * 70)

    batch_num = 1
    total_committed = 0
    batches_successful = 0

    for i in range(0, len(small_files), BATCH_SIZE):
        batch = small_files[i : i + BATCH_SIZE]
        if batch_add_and_commit(batch, batch_num):
            total_committed += len(batch)
            batches_successful += 1
        batch_num += 1

    # Summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"✅ Committed: {total_committed} files")
    print(f"✅ Batches: {batches_successful}")
    print(f"⚠️  Skipped: {len(large_files)} files (>100MB)")

    # Offer to push
    if total_committed > 0:
        print("\n📤 Ready to push to GitHub")
        response = input("Push now? (y/n): ").strip().lower()
        if response == "y":
            if push_to_github():
                print("\n✅ All done!")
                return 0
            else:
                print("\n⚠️  Push incomplete - try again later")
                return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
