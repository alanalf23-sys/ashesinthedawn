from PyInstaller.utils.hooks import collect_data_files, collect_submodules

# Collect all arviz submodules
hiddenimports = collect_submodules('arviz')

# Collect all data files
datas = collect_data_files('arviz', include_py_files=True)

# Add specific static files
datas += [
    ('venv/Lib/site-packages/arviz/static/html/*', 'arviz/static/html'),
    ('venv/Lib/site-packages/arviz/static/css/*', 'arviz/static/css'),
    ('venv/Lib/site-packages/arviz/static/js/*', 'arviz/static/js')
]
