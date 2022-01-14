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

OLD_VERSION=$(cat VERSION)
sed -i "s/$OLD_VERSION/$1/" package.json
sed -i "s/$OLD_VERSION/$1/" package-lock.json

echo "### Update VERSION to $1"
echo "$1" > VERSION

VERSION=$(cat VERSION)

echo "### Commit and tag release"
git commit -am "Release v$VERSION"
git tag "v$VERSION"

echo "### Push to remote"
git push && git push --tags

echo "### Merge back to master"
git checkout master
git merge production master

echo "### Set development version"
DEV_VERSION="$VERSION-dev"
echo "$DEV_VERSION" > VERSION
sed -i -E 's/(^  "version": ")'$VERSION'(",)$/\1'$DEV_VERSION'\2/' package.json
sed -i -E 's/(^  "version": ")'$VERSION'(",)$/\1'$DEV_VERSION'\2/' package-lock.json
git commit -am "Set development version to $DEV_VERSION"
git push

echo "########## SUCCESS! ##########"

git checkout production
