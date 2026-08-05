#!/bin/sh
#
# Gradle startup script for UN*X
#
APP_HOME=$(cd "$(dirname "$0")" && pwd -P) || exit
APP_BASE_NAME="${0##*/}"
CLASSPATH="$APP_HOME/gradle/wrapper/gradle-wrapper.jar"
DEFAULT_JVM_OPTS='"-Xmx64m" "-Xms64m"'

if [ -n "$JAVA_HOME" ]; then
    JAVA_CMD="$JAVA_HOME/bin/java"
else
    JAVA_CMD="java"
fi

# Bootstrap wrapper jar if missing
if [ ! -f "$CLASSPATH" ]; then
    mkdir -p "$APP_HOME/gradle/wrapper"
    echo "Downloading Gradle wrapper..."
    curl -L "https://services.gradle.org/distributions/gradle-8.6-bin.zip" -o /tmp/gradle-boot.zip
    unzip -q /tmp/gradle-boot.zip -d /tmp/gradle-boot
    cp /tmp/gradle-boot/gradle-8.6/lib/gradle-wrapper-*.jar "$CLASSPATH" 2>/dev/null || \
    find /tmp/gradle-boot -name "gradle-wrapper.jar" -exec cp {} "$CLASSPATH" \;
    rm -rf /tmp/gradle-boot /tmp/gradle-boot.zip
fi

save () {
    for i do printf %s\\n "$i" | sed "s/'/'\\\\''/g;1s/^/'/;\$s/\$/' /" ; done
}
APP_ARGS=$(save "$@")
eval set -- $DEFAULT_JVM_OPTS $JAVA_OPTS $GRADLE_OPTS \
    "\"-Dorg.gradle.appname=$APP_BASE_NAME\"" \
    -classpath "\"$CLASSPATH\"" \
    org.gradle.wrapper.GradleWrapperMain \
    "$APP_ARGS"
exec "$JAVA_CMD" "$@"
