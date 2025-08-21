#!/bin/bash
# Spin up backend on uvicorn

cd /Users/alexrowe/Desktop/Quantly
source qenv/bin/activate
python -m uvicorn app.main:app --reload --port 8000