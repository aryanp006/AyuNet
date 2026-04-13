import sys
import os

# Ensure the backend directory is accessible
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(root_dir, "backend")
sys.path.append(root_dir)
sys.path.append(backend_dir)

from backend.main import app
