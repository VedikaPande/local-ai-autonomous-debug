FROM ubuntu:22.04

# Install multiple language runtimes
RUN apt-get update && apt-get install -y \
    --no-install-recommends \
    python3 \
    python3-pip \
    gcc \
    g++ \
    openjdk-11-jdk \
    make \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create symbolic link for python
RUN ln -s /usr/bin/python3 /usr/bin/python

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash --uid 1001 coderunner

# Set working directory
WORKDIR /code

# Copy executor (for legacy compatibility)
COPY executor.py /usr/local/bin/executor.py

# Create secure temp directory
RUN mkdir -p /tmp/code && chown coderunner:coderunner /tmp/code

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONPATH=/usr/local/bin
ENV JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
ENV PATH=$PATH:$JAVA_HOME/bin

# Switch to non-root user
USER coderunner

# Default command for interactive use
CMD ["bash"]
