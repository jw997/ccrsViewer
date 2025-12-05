#!/bin/bash
set -e
echo "Removing downloaded and generated files"
mkdir -p temp/output
mkdir output
rm temp/urls temp/toc.html || true
rm temp/*.csv || true;
rm temp/output/* || true;

wget -O temp/toc.html https://data.ca.gov/dataset/ccrs

grep schema:url temp/toc.html  | grep -o 'http.*csv' | sort  -t '/' -k 8  > temp/urls

#download all urls to temp
wget -P temp -i temp/urls

rename 's/hq1d-p-app52dopendataexport//' temp/hq1d-p-app52dopendataexport20*

sed -i 's/\t//g' temp/20*crashes.csv 

for year in {2016..2025}; do
  echo "check files for year ${year}"
  if [ ! -f temp/${year}crashes.csv ]; then
    echo "Expected file temp/${year}crashes.csv not found" 
  fi
  if [ ! -f temp/${year}parties.csv ]; then
    echo "Expected file temp/${year}parties.csv not found" 
  fi
  if [ ! -f temp/${year}injuredwitnesspassengers.csv ]; then
    echo "Expected file temp/${year}injuredwitnesspassengers.csv not found" 
  fi    
done

for year in {2016..2025}; do
  echo "Processing year ${year}"
  node  ccrsToJson.js  temp/${year}crashes.csv temp/${year}parties.csv temp/${year}injuredwitnesspassengers.csv  temp/output/ccrs${year}.json | tee temp/log${year}
done

echo "look for output in temp/ouput/"
echo "bye"

