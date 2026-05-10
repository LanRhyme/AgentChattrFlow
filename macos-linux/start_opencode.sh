#!/bin/bash
# agentchattr — starts the OpenCode agent

# Get the script directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR/.."

# Auto-create venv and install deps on first run
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
    .venv/bin/pip install -q -r requirements.txt
fi
source .venv/bin/activate

python3 run.py --agent opencode
