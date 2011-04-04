#!/bin/bash

WORK_PATH=`pwd`
SOURCE_PATH="${WORK_PATH}/src" # No slash end
DOCUMENT_PATH="${WORK_PATH}/doc/"
PACKAGE_PATH="${WORK_PATH}/pkg/" 
EXCLUDED_FILES='icon.svg obsoleted.js'

if [ $# -ne 2 ]
then
    cat <<__USAGE__
Packaging help script for Sidetalk - Google Chrome extension

Usage:
    bash $0 [path to YUI Compressor] [path to JsDoc Toolkit]

    YUICompressor: /path/to/yuicompressor-x.y.z.jar
    JsDoc Toolkit: /path/to/jsdoc-toolkit-x.y.z/jsrun.jar

Description:
    This script automatically compress and optimise JavaScript & CSS files.
    After running this script with correct argument, "pkg" directory will be
    cleared and replaced with new files.

Dependencies:
    * JsDoc Toolkit http://code.google.com/p/jsdoc-toolkit/
    * YUI Compressor http://developer.yahoo.com/yui/compressor/

__USAGE__
    exit
fi

if ! test -f ${1}
then
    echo "Argument is incorrect: $1"
    exit
fi

if ! test -f ${2}
then
    echo "Argument is incorrect: $2"
    exit
fi

if ! test -d ${SOURCE_PATH}
then
    echo "Source directory is invalid: ${SOURCE_PATH}"
    exit
fi

if ! test -d ${DOCUMENT_PATH}
then
    echo "Document directory is invalid: ${DOCUMENT_PATH}"
    exit
fi

if ! test -d ${PACKAGE_PATH}
then
    echo "Package directory is invalid: ${PACKAGE_PATH}"
    exit
fi

rm -rf ${PACKAGE_PATH}/*
echo "Files of package directory cleared: ${PACKAGE_PATH}"

# Chechk all of file in SOURCE_PATH
for FILE_PATH in `find ${SOURCE_PATH} -type f`
do
    if ! test -f ${FILE_PATH}
    then
        echo "Skipped invalid file: '${FILE_PATH##*/}'"
        break
    fi
    FILE_PATH_LIST=("${FILE_PATH_LIST[@]}" "${FILE_PATH}")
done
# Add extra file into FILE_PATH_LIST
FILE_PATH_LIST=("${FILE_PATH_LIST[@]}" "${WORK_PATH}/LICENCE")

# Generate JsDoc
java -jar ${2} ${2%/*}/app/run.js \
               --template=${2%/*}/templates/jsdoc/ \
               --allfunctionsa \
               --encoding=utf8 \
               --test \
               --directory=${DOCUMENT_PATH} \
               ${SOURCE_PATH}         
echo "Documents created"

# Start main proccess
for (( I = 0; I < ${#FILE_PATH_LIST[@]}; ++I ))
do
    # Check if the file is excluded or not
    for EXCLUDED_FILE in ${EXCLUDED_FILES}
    do
        if [ ${FILE_PATH_LIST[I]##*/} = ${EXCLUDED_FILE} ]
        then
            echo "Skipped excluded file: ${EXCLUDED_FILE}"
            let I=I+1
            break
        fi
    done
    # Optimise JavaScript files
    if echo ${FILE_PATH_LIST[I]##*/} | grep ".*\.js$" > /dev/null
    then
        java -jar ${1} \
                  --charset utf8 \
                  --preserve-semi \
                  -o ${PACKAGE_PATH}${FILE_PATH_LIST[I]##*/} \
                  ${FILE_PATH_LIST[I]}
        echo "Copied optimised file: ${FILE_PATH_LIST[I]##*/}"
    # Optimise CSS files
    elif echo ${FILE_PATH_LIST[I]##*/} | grep ".*\.css$" > /dev/null
    then
        java -jar ${1} \
                  --charset utf8 \
                  -o ${PACKAGE_PATH}${FILE_PATH_LIST[I]##*/} \
                  ${FILE_PATH_LIST[I]}
        echo "Copied optimised file: ${FILE_PATH_LIST[I]##*/}"
    # Copy other files
    else
        cp ${FILE_PATH_LIST[I]} ${PACKAGE_PATH}
        echo "Copied file: ${FILE_PATH_LIST[I]##*/}"
    fi
done
