"""One-time database cleanup script.

Removes all test/demo investigations created during development.
Run ONCE: python cleanup_db.py
Do NOT add this to application startup.
"""
import sys
import os

# Ensure backend app is importable
sys.path.insert(0, os.path.dirname(__file__))

from app.database.database import init_db, SessionLocal
from app.models.models import Investigation
from app.core.config import settings

init_db()
db = SessionLocal()

TEST_KEYWORDS = [
    'verification test workspace',
    'e2e test',
    'demo investigation',
]

to_delete = []
for inv in db.query(Investigation).all():
    name_lower = inv.name.lower()
    if any(kw in name_lower for kw in TEST_KEYWORDS):
        to_delete.append(inv)

if not to_delete:
    print("No test/demo investigations found to clean up.")
    db.close()
    sys.exit(0)

print(f"Found {len(to_delete)} test/demo investigation(s) to delete:")
for inv in to_delete:
    print(f"  - [{inv.id[:8]}...] {inv.name}")

confirm = input("\nProceed with deletion? (yes/no): ").strip().lower()
if confirm != 'yes':
    print("Aborted.")
    db.close()
    sys.exit(0)

deleted = 0
for inv in to_delete:
    # Remove uploaded file if it's a copy (not the raw dataset)
    if inv.dataset:
        fp = settings.UPLOAD_DIR / inv.dataset.stored_filename
        if fp.exists() and not inv.dataset.stored_filename == 'HI-Small_Trans.csv':
            try:
                fp.unlink()
                print(f"  Deleted file: {inv.dataset.stored_filename}")
            except Exception as e:
                print(f"  Could not delete file {inv.dataset.stored_filename}: {e}")
    db.delete(inv)
    deleted += 1

db.commit()
print(f"\nCleanup complete. Deleted {deleted} investigation(s).")
db.close()
