"""
Quick test script to verify backend setup
Run this before starting the main app: python test_backend.py
"""
import sys
import os

print("=" * 50)
print("Backend Setup Test")
print("=" * 50)

# Test 1: Python version
print("\n1. Checking Python version...")
python_version = sys.version_info
if python_version.major >= 3 and python_version.minor >= 8:
    print(
        f"   [OK] Python {python_version.major}.{python_version.minor}.{python_version.micro}")
else:
    print(
        f"   [ERROR] Python {python_version.major}.{python_version.minor} - Need 3.8+")
    sys.exit(1)

# Test 2: Check if we're in the right directory
print("\n2. Checking directory structure...")
required_dirs = ['backend', 'frontend', 'data']
for dir_name in required_dirs:
    if os.path.exists(dir_name):
        print(f"   [OK] {dir_name}/ exists")
    else:
        print(f"   [ERROR] {dir_name}/ not found")

# Test 3: Check backend files
print("\n3. Checking backend files...")
backend_files = [
    'backend/app.py',
    'backend/requirements.txt',
    'backend/algorithms/disassembly_optimizer.py'
]
for file_path in backend_files:
    if os.path.exists(file_path):
        print(f"   [OK] {file_path}")
    else:
        print(f"   [ERROR] {file_path} not found")

# Test 4: Check data files
print("\n4. Checking data files...")
data_files = [
    'data/csv/kettle_graph.csv',
    'data/csv/gearbox_graph.csv',
    'data/metadata/kettle_metadata.json',
    'data/metadata/gearbox_metadata.json'
]
for file_path in data_files:
    if os.path.exists(file_path):
        print(f"   [OK] {file_path}")
    else:
        print(f"   [WARNING] {file_path} not found (optional for testing)")

# Test 5: Try importing required modules
print("\n5. Testing Python imports...")
try:
    import flask
    print("   [OK] Flask")
except ImportError:
    print(
        "   [ERROR] Flask not installed - run: pip install -r backend/requirements.txt")

try:
    import pandas
    print("   [OK] Pandas")
except ImportError:
    print("   [ERROR] Pandas not installed")

try:
    import networkx
    print("   [OK] NetworkX")
except ImportError:
    print("   [ERROR] NetworkX not installed")

try:
    import neo4j
    print("   [OK] Neo4j driver")
except ImportError:
    print("   [WARNING] Neo4j driver not installed (optional)")

print("\n" + "=" * 50)
print("Next Steps:")
print("=" * 50)
print("1. cd backend")
print("2. python -m venv venv")
print("3. venv\\Scripts\\activate")
print("4. pip install -r requirements.txt")
print("5. python app.py")
print("\nThen in another terminal:")
print("1. cd frontend")
print("2. npm install")
print("3. npm start")
print("=" * 50)
