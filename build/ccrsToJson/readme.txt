download from ccrs
remove tabs with sed 
run node 


sed 's/\t//g' ccrs2025crashes.csv >good.2025

node ccrsToJson.js  good.2025 ccrs2025parties.csv ccrs2025iwp.csv 
cp testoutput.json  ../../data/ccrs/ccrs2025.json



