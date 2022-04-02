rsync -r src/ docs/
rsync build/contracts/* docs/
git add .
git commit -m "Compiles assets for Github Pages"
git pull origin master
git push origin master