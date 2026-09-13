import os
import sys
import time
import subprocess
import webbrowser
from pathlib import Path

def main():
    root_dir = Path(__file__).resolve().parent
    frontend_dir = root_dir / "frontend"

    print("=" * 70)
    print("🚀 LAUNCHING INCIDENT COMMANDER AGENT MISSION CONTROL")
    print("=" * 70)
    print("1. Starting FastAPI Backend Server on http://127.0.0.1:8000...")
    
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "incident_commander.web.server:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=str(root_dir)
    )

    print("2. Starting Vite React Frontend on http://localhost:5173...")
    frontend_proc = subprocess.Popen(
        ["npm.cmd" if os.name == "nt" else "npm", "run", "dev"],
        cwd=str(frontend_dir)
    )

    time.sleep(2.5)
    url = "http://localhost:5173"
    print(f"3. Opening Browser to {url}...")
    try:
        webbrowser.open(url)
    except Exception:
        pass

    print("\n✅ System Live! Press Ctrl+C to terminate both servers.\n")

    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\nShutting down Incident Commander...")
        backend_proc.terminate()
        frontend_proc.terminate()

if __name__ == "__main__":
    main()
