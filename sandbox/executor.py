import subprocess, sys, json, resource

def limit_resources():
    resource.setrlimit(resource.RLIMIT_CPU, (2, 2))
    resource.setrlimit(resource.RLIMIT_AS, (256*1024*1024, 256*1024*1024))

def run():
    data = json.loads(sys.stdin.read())
    code = data["code"]

    with open("user_code.py", "w") as f:
        f.write(code)

    limit_resources()

    try:
        result = subprocess.run(
            ["python3", "user_code.py"],
            capture_output=True,
            text=True,
            timeout=3
        )

        output = {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "exit_code": result.returncode
        }

    except subprocess.TimeoutExpired:
        output = {"timeout": True}

    print(json.dumps(output))

run()
