#!/usr/bin/env bash
set -e

[ -z "$1" ] && echo "You must supply the VERSION to release" && exit 1

read -p "This will STASH UNSTAGED/STAGED changes. Proceed? (yN) " -n 1 -r

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    exit 1
fi

printf "\n\n"

echo "### Stash all local changes"
git stash

echo "### Pull all changes from remote server"
git pull

echo "### Checkout and reset master branch"
git checkout master
git reset --hard origin/master

echo "### Checkout and reset production branch"
git checkout production
git reset --hard origin/production

echo "### Generate documentation"
npm run doc

echo "### Merge master to production"
git merge master production

echo "### Update package version in examples"
OLD_VERSION=$(cat VERSION)
sed -i "s/\"@uhlive\/javascript-sdk\": \"^$OLD_VERSION\"/\"@uhlive\/javascript-sdk\": \"^$VERSION\"/" examples/**/package.json

echo "### Update VERSION to $1"
echo "$1" > VERSION

echo "### Commit and tag release"
npm version "$1"

echo "### Push to remote"
git push && git push --tags

echo "### Merge back to master"
git checkout master
git merge production master

echo "### Set development version"
DEV_VERSION="$VERSION-dev"
echo "$DEV_VERSION" > VERSION
sed -i "s/\"@uhlive\/javascript-sdk\": \"^$VERSION\"/\"@uhlive\/javascript-sdk\": \"^$DEV_VERSION\"/" examples/**/package.json
npm version "$DEV_VERSION"
git push

echo "########## SUCCESS! ##########"

git checkout production
