import os
import sys
from app.backend.db import get_db
from app.backend.db.models import User
from app.backend import create_app

app = create_app()

def clear_all_users():
    with app.app_context():
        db = get_db()
        db.query(User).delete()
        db.commit()
        print("All users have been deleted.")

if __name__ == "__main__":
    clear_all_users()
