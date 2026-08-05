#!/bin/sh
#
# Gradle startup script for UN*X
#

# Resolve symlinks to find APP_HOME
PRG="$0"
while [ -h "$PRG" ]; do
    ls=$(ls -ld "$PRG")
    link=$(expr "$ls" : '.*-> \(.*\)$')
    if expr "$link" : '/.*' > /dev/null; then
        PRG="$link"
    else
        PRG="$(dirname "$PRG")/$link"
    fi
done
APP_HOME="$(cd "$(dirname "$PRG")" && pwd)"
APP_BASE_NAME="$(basename "$0")"
CLASSPATH="$APP_HOME/gradle/wrapper/gradle-wrapper.jar"

# Bootstrap: download wrapper jar if missing
if [ ! -f "$CLASSPATH" ]; then
    mkdir -p "$APP_HOME/gradle/wrapper"
    echo "Downloading Gradle wrapper jar..."
    TMP_ZIP="/tmp/gradle-boot-$$.zip"
    TMP_DIR="/tmp/gradle-boot-$$"
    curl -fsSL "https://services.gradle.org/distributions/gradle-8.6-bin.zip" -o "$TMP_ZIP"
    mkdir -p "$TMP_DIR"
    unzip -q "$TMP_ZIP" -d "$TMP_DIR"
    JAR=$(find "$TMP_DIR" -name "gradle-wrapper.jar" | head -1)
    [ -n "$JAR" ] && cp "$JAR" "$CLASSPATH"
    rm -rf "$TMP_ZIP" "$TMP_DIR"
fi

# Locate java
if [ -n "$JAVA_HOME" ]; then
    JAVACMD="$JAVA_HOME/bin/java"
else
    JAVACMD="java"
fi

exec "$JAVACMD" \
    -Xmx64m -Xms64m \
    $JAVA_OPTS \
    $GRADLE_OPTS \
    "-Dorg.gradle.appname=$APP_BASE_NAME" \
    -classpath "$CLASSPATH" \
    org.gradle.wrapper.GradleWrapperMain \
    "$@"
