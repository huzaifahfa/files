# Backend for PowerPoint Generation

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the server:
```bash
python main.py
# Or: uvicorn main:app --reload
```

The API will be available at http://localhost:8000

## API Endpoint

**POST /generate-pptx**

Send the JSON from the frontend to generate a PowerPoint file.

Example:
```json
{
  "title": "My Presentation",
  "mode": "dumbass",
  "slides": [...]
}
```

Returns: .pptx file download
