#!/bin/bash

# Build the secure Python execution Docker image

echo "Building secure Python executor Docker image..."

# Build the image
docker build -t python-executor:latest .

if [ $? -eq 0 ]; then
    echo "Docker image built successfully!"
    echo "Image: python-executor:latest"
    
    # Test the image
    echo "Testing the image..."
    echo 'print("Hello from Docker!")' | docker run --rm -i python-executor:latest python -c "import sys; exec(sys.stdin.read())"
    
    if [ $? -eq 0 ]; then
        echo "Image test passed!"
    else
        echo "Image test failed!"
        exit 1
    fi
else
    echo "Failed to build Docker image!"
    exit 1
fi

echo "Usage:"
echo "  docker run --rm python-executor:latest python -c 'print(\"test\")'"
echo "  Or use the CodeExecutor class which will automatically use this image"