@echo off
REM Build the multi-language code execution Docker image

echo Building multi-language code executor Docker image...

REM Build the image
docker build -t multi-lang-executor:latest .

if %ERRORLEVEL% EQU 0 (
    echo SUCCESS: Docker image built successfully!
    echo Image: multi-lang-executor:latest
    
    REM Test the image with multiple languages
    echo Testing Python...
    docker run --rm multi-lang-executor:latest python -c "print('Hello from Python!')"
    
    echo Testing C++...
    docker run --rm multi-lang-executor:latest g++ --version
    
    echo Testing C...
    docker run --rm multi-lang-executor:latest gcc --version
    
    echo Testing Java...
    docker run --rm multi-lang-executor:latest java -version
    
    if %ERRORLEVEL% EQU 0 (
        echo SUCCESS: All language runtimes available!
        echo.
        echo Usage:
        echo   docker run --rm multi-lang-executor:latest python -c "print('test')"
        echo   docker run --rm multi-lang-executor:latest g++ --version
        echo   docker run --rm multi-lang-executor:latest java -version
        echo   Or use the CodeExecutor class which will automatically use this image
    ) else (
        echo ERROR: Some language tests failed!
        exit /b 1
    )
) else (
    echo ERROR: Failed to build Docker image!
    exit /b 1
)

echo.
echo Multi-language Docker image is ready for use!