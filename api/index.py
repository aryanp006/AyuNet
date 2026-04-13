import sys
import os

# Ensure the backend directory is accessible
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app
