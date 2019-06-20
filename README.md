# speed-tests
use for performance testing for landing pages

## to install dependancies, run
'npm i'

## then create a .env file to include your username, password, API_SECRET by running the below in the root directory
'touch .env'

## this will create the .env file, then add in these pieces as such
'USER={your_username}
PASS={your_pass}
API_SECRET={API_SECRET}'

## set the 'tagName' variable to whatever configuration of tags you need to test e.g.
'const tagName = 'TEST V1''

## finally, run the script by running
'node run-tests.js'

### note - the first test won't run until after the specified interval from the tickInterval variable e.g. out of the box it's every 12 minutes


