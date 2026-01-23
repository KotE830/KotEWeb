#!/bin/bash

echo "Starting Lavalink Server..."
echo ""
echo "Make sure Java 21 is installed and JAVA_HOME is set."
echo ""

cd "$(dirname "$0")"

# Java 21을 찾아서 사용
JAVA_CMD=""

# 방법 1: JAVA_HOME이 설정되어 있고 Java 21을 가리키는 경우
if [ -n "$JAVA_HOME" ]; then
    if [ -f "$JAVA_HOME/bin/java" ]; then
        JAVA_VERSION=$("$JAVA_HOME/bin/java" -version 2>&1 | head -n 1)
        if echo "$JAVA_VERSION" | grep -q "version \"21"; then
            JAVA_CMD="$JAVA_HOME/bin/java"
            echo "Using Java 21 from JAVA_HOME: $JAVA_HOME"
        fi
    fi
fi

# 방법 2: 시스템 PATH에서 Java 21 찾기
if [ -z "$JAVA_CMD" ]; then
    echo "Checking for Java 21 in system PATH..."
    for java_path in $(which -a java 2>/dev/null); do
        JAVA_VERSION=$("$java_path" -version 2>&1 | head -n 1)
        if echo "$JAVA_VERSION" | grep -q "version \"21"; then
            JAVA_CMD="$java_path"
            echo "Found Java 21: $JAVA_CMD"
            break
        fi
    done
fi

# 방법 3: 일반적인 Java 21 설치 경로 확인
if [ -z "$JAVA_CMD" ]; then
    JAVA_PATHS=(
        "/usr/lib/jvm/java-21-openjdk/bin/java"
        "/usr/lib/jvm/java-21/bin/java"
        "/opt/java/jdk-21/bin/java"
        "$HOME/.sdkman/candidates/java/21.0.*/bin/java"
    )
    
    for java_path in "${JAVA_PATHS[@]}"; do
        # glob 확장 처리
        for expanded_path in $java_path; do
            if [ -f "$expanded_path" ]; then
                JAVA_CMD="$expanded_path"
                echo "Found Java 21 at: $JAVA_CMD"
                break 2
            fi
        done
    done
fi

# Java 21을 찾지 못한 경우 경고
if [ -z "$JAVA_CMD" ]; then
    echo ""
    echo "WARNING: Java 21 not found!"
    echo "Please install Java 21 or set JAVA_HOME to point to Java 21 installation."
    echo ""
    echo "Attempting to use default java command (may not be Java 21)..."
    java -version
    java -jar Lavalink.jar
else
    "$JAVA_CMD" -jar Lavalink.jar
fi

