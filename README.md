# NSC
Nordic Sitecore Conference - Static Site

## How to generate the site

1. Clone the git repo
2. Open a command line in the folder
3. Type `npm install`, this will intall all node dependencies.
4. Type `bower install`, this will intall all frontend dependencies.
5. Type `gulp build` this will make a `dist` folder containing all the static files.

If you are developing you can type `gulp serve` this will start a local preview server with auto reload making it easy to develop now features.

## Deploy
1. Open a git shell in the folder
2. Type `gulp deploy`, this will push it to the website. You might see a delay due to caching. Contact Allan if there are problems.

## Problems with git
Some firewalls might not like Git, type the following command in your Git Shell to fix this.
`git config --global url."https://".insteadOf git://`