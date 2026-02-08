# Python Environment Issue - Turn Pro Poker

## Problem
This machine has **two Python versions** installed:
- Python 3.11: `C:\Users\USER\AppData\Local\Programs\Python\Python311\`
- Python 3.14: `C:\Users\USER\AppData\Local\Python\pythoncore-3.14-64\`

The default `python` command points to **Python 3.14**, but `pip` installs packages to **Python 3.11**.

This causes `ModuleNotFoundError` when running the backend.

## Quick Fix
Use `py -3.11` instead of `python`:
```powershell
py -3.11 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Permanent Fix (Recommended)
Create a virtual environment in the backend folder:
```powershell
cd backend
py -3.11 -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

Then run normally:
```powershell
.\venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Alternative: Set Python 3.11 as Default
1. Open System Environment Variables
2. Edit `PATH`
3. Move Python 3.11 paths **above** Python 3.14 paths
