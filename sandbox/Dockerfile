FROM python:3.10-slim

WORKDIR /sandbox

RUN apt-get update && apt-get install -y gcc

COPY executor.py .

CMD ["python3", "executor.py"]
