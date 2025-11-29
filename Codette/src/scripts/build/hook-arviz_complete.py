"""
PyInstaller hook for arviz package to ensure static files are included
"""
from PyInstaller.utils.hooks import collect_data_files, copy_metadata, get_package_paths
import os
import pathlib
from PyInstaller.compat import is_win

# Get arviz package paths
pkg_base, pkg_dir = get_package_paths('arviz')

# Get static files directory
static_dir = os.path.join(pkg_dir, 'static')
datas = []

# Add all static files
if os.path.exists(static_dir):
    for root, dirs, files in os.walk(static_dir):
        for file in files:
            file_path = os.path.join(root, file)
            # Calculate the relative path from the package root
            rel_dir = os.path.relpath(root, pkg_dir)
            datas.append((file_path, rel_dir))

# Add HTML templates
templates_dir = os.path.join(pkg_dir, 'templates')
if os.path.exists(templates_dir):
    for root, dirs, files in os.walk(templates_dir):
        for file in files:
            file_path = os.path.join(root, file)
            rel_dir = os.path.relpath(root, pkg_dir)
            datas.append((file_path, rel_dir))

# Add standard package data
datas.extend(collect_data_files('arviz', include_py_files=True))

# Add package metadata
datas.extend(copy_metadata('arviz'))
