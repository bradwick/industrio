FROM python:3.12-slim

WORKDIR /app

# Install Node.js to build frontend
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Copy package files and install frontend dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build frontend static assets
COPY . .
RUN npm run build

# Install Python requirements
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8000

CMD ["python", "server.py"]
