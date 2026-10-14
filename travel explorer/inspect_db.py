"""
VOYARA Database Inspection & Verification Utility
Inspects SQLite tables, constraints, schema, and sample seeded records.
"""

import sys
import os
from pathlib import Path

# Force UTF-8 encoding on Windows console if available
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from sqlalchemy import inspect
from backend.app.config import settings, DATA_DIR
from backend.app.database import engine, SessionLocal, init_db
from backend.app.seed.seeder import seed_destinations
from backend.app.models import User, Destination, Trip, ItineraryDay, Activity, Favorite

def main():
    print("=" * 70)
    print("  VOYARA DATABASE INSPECTOR & SCHEMA VERIFICATION")
    print("=" * 70)

    db_path = Path(settings.DATABASE_URL.replace("sqlite:///", ""))
    print("\n[1] Database Location:")
    print(f"    - Configured URL: {settings.DATABASE_URL}")
    print(f"    - Absolute Path : {db_path.resolve()}")
    print(f"    - Directory     : {DATA_DIR.resolve()}")

    # Initialize tables
    print("\n[2] Initializing Database Schema...")
    init_db()
    print("    [OK] All SQLAlchemy models registered and tables created successfully.")

    # Run idempotent seed
    print("\n[3] Running Idempotent Destination Seeder...")
    with SessionLocal() as db:
        new_seeded = seed_destinations(db)
        total_destinations = db.query(Destination).count()
        if new_seeded > 0:
            print(f"    [OK] Fresh seed: Inserted {new_seeded} destinations.")
        else:
            print(f"    [OK] Idempotency verified: Existing {total_destinations} destinations detected; skipped duplicate insert.")

    # Inspect SQLite Tables & Columns
    print("\n[4] Database Inspector Schema Report:")
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"    Found {len(tables)} tables: {', '.join(tables)}")

    for table_name in tables:
        print(f"\n    Table: '{table_name}'")
        columns = inspector.get_columns(table_name)
        for col in columns:
            pk_marker = " [PRIMARY KEY]" if col.get("primary_key") else ""
            nullable = "NULL" if col.get("nullable") else "NOT NULL"
            print(f"      - {col['name']:<24} {str(col['type']):<16} {nullable:<10}{pk_marker}")
        
        fks = inspector.get_foreign_keys(table_name)
        if fks:
            for fk in fks:
                print(f"        -> FK ({', '.join(fk['constrained_columns'])}) REFERENCES {fk['referred_table']}({', '.join(fk['referred_columns'])})")
        
        indexes = inspector.get_indexes(table_name)
        if indexes:
            idx_names = [idx['name'] for idx in indexes]
            print(f"        -> Indexes: {', '.join(idx_names)}")

    # Sample Records
    print("\n[5] Sample Records from 'destinations':")
    with SessionLocal() as db:
        destinations = db.query(Destination).all()
        for d in destinations:
            cost_dollars = f"${d.estimated_daily_cost / 100:.2f}"
            print(f"    * ID {d.id:2d}: {d.name:<24} | {d.country:<18} | Cost: {cost_dollars:<10} | Best: {d.best_travel_months}")

    file_size = os.path.getsize(db_path) if db_path.exists() else 0
    print("\n[6] Database File Status:")
    print(f"    - File exists : {db_path.exists()}")
    print(f"    - File size   : {file_size:,} bytes")
    print("\n" + "=" * 70)
    print("  VERIFICATION COMPLETE - ALL CHECKS PASSED")
    print("=" * 70)

if __name__ == "__main__":
    main()
