#!/usr/bin/env python3
import os
import sys
import zipfile

def create_archive(output_path, include_git=False):
    exclude_dirs = {'node_modules', 'dist', '.cache', '__pycache__', 'coverage'}
    if not include_git:
        exclude_dirs.add('.git')
    exclude_files = {'.DS_Store'}

    # Ensure parent dir exists
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk('.'):
            # filter in-place to avoid descending into excluded directories
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            for file in files:
                if file in exclude_files or file.endswith('.log'):
                    continue
                # Do not package real secret .env files
                if file.startswith('.env') and file != '.env.example':
                    continue
                filepath = os.path.join(root, file)
                arcname = os.path.relpath(filepath, '.')
                zipf.write(filepath, arcname)

if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else '/tmp/farmpal-source.zip'
    inc_git = '--include-git' in sys.argv
    create_archive(target, inc_git)
    print(f"Archive created at {target} ({os.path.getsize(target)} bytes)")
